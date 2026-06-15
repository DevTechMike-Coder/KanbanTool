"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { createNotification } from "@/app/actions/notifications";
import { logActivity } from "@/app/actions/activity";
import { revalidatePath } from "next/cache";

async function verifyProjectAccess(projectId: string): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new Error("You must be logged in to perform this action.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.teamId) {
    const isMember = await prisma.team.findFirst({
      where: { id: project.teamId, members: { some: { id: userId } } },
      select: { id: true },
    });
    if (!isMember) {
      throw new Error("You do not have access to this project.");
    }
  }
  return userId;
}

async function verifyTaskAccess(taskId: string): Promise<string> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });
  if (!task) {
    throw new Error("Task not found.");
  }
  return verifyProjectAccess(task.projectId);
}

export async function ensureDefaultProject() {
  const defaultProjectId = "vertex-core";
  let project = await prisma.project.findUnique({
    where: { id: defaultProjectId },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        id: defaultProjectId,
        name: "Vertex Core App",
        summary:
          "Build the operational workspace for team planning and delivery.",
        productGoal:
          "A working app where teams can plan project paths, track blockers, and keep moving without losing ownership.",
      },
    });
  }
  return project;
}

export async function getTasks(projectId: string) {
  await verifyProjectAccess(projectId);
  return prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: true,
      dependencies: {
        select: { id: true, title: true, column: true, priority: true },
      },
      blockedTasks: {
        select: { id: true, title: true, column: true, priority: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateTaskColumn(taskId: string, column: string) {
  await verifyTaskAccess(taskId);
  // Snapshot previous column for activity meta
  const previous = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      column: true,
      title: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { column },
  });

  // Fire-and-forget — never awaited to keep the hot path fast
  void logActivity({
    action: "task_moved",
    projectId: previous?.projectId,
    projectName: previous?.project?.name,
    taskId,
    taskTitle: previous?.title,
    meta: { from: previous?.column, to: column },
  });

  return updated;
}

export async function createTask(
  projectId: string,
  title: string,
  column: string = "todo",
  priority: string = "medium",
  dueDate: Date | null = null,
) {
  const userId = await verifyProjectAccess(projectId);
  const count = await prisma.task.count({ where: { projectId } });
  let displayId = "";
  let suffix = count + 1;
  while (true) {
    displayId = `VTX-${100 + suffix}`;
    const existing = await prisma.task.findUnique({
      where: { id: displayId },
      select: { id: true },
    });
    if (!existing) break;
    suffix++;
  }

  const task = await prisma.task.create({
    data: {
      id: displayId,
      title,
      column,
      priority,
      dueDate,
      projectId,
      creatorId: userId,
    },
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  void logActivity({
    action: "task_created",
    projectId,
    projectName: project?.name,
    taskId: task.id,
    taskTitle: title,
    meta: { column, priority },
  });

  return task;
}

export async function deleteTask(taskId: string) {
  await verifyTaskAccess(taskId);
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      title: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });

  const result = await prisma.task.delete({ where: { id: taskId } });

  void logActivity({
    action: "task_deleted",
    projectId: task?.projectId,
    projectName: task?.project?.name,
    taskId,
    taskTitle: task?.title,
  });

  return result;
}

/** Returns only the profiles who are members of the team that owns the project. */
export async function getProjectMembers(projectId: string) {
  await verifyProjectAccess(projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      team: {
        select: {
          members: {
            select: { id: true, name: true, email: true, avatarUrl: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });
  return project?.team?.members ?? [];
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    assigneeId?: string | null;
    comments?: number;
    files?: number;
    column?: string;
    priority?: string;
    dueDate?: Date | null;
    labels?: string[];
  },
) {
  await verifyTaskAccess(taskId);
  const current = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      title: true,
      column: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });

  if (data.assigneeId && data.assigneeId !== current?.assigneeId) {
    const actorId = await getSessionUserId();
    const actor = actorId
      ? await prisma.profile.findUnique({
          where: { id: actorId },
          select: { name: true },
        })
      : null;

    await createNotification(
      data.assigneeId,
      "task_assigned",
      `${actor?.name ?? "Someone"} assigned you to "${current?.title}"`,
      "/home",
    );

    void logActivity({
      action: "task_assigned",
      projectId: current?.projectId,
      projectName: current?.project?.name,
      taskId,
      taskTitle: current?.title,
      meta: { assigneeId: data.assigneeId },
    });
  }

  // Destructure relation/array fields from plain scalars
  const { assigneeId, labels, ...scalarData } = data;

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...scalarData,
      // Scalar array: must use { set } in updates
      ...(labels !== undefined && { labels: { set: labels } }),
      // assigneeId is a plain FK scalar — can set/null directly
      ...(assigneeId !== undefined && { assigneeId }),
    },
    include: { assignee: true },
  });
}

export async function getProjects(teamIds?: string[]) {
  if (teamIds && teamIds.length > 0) {
    return prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { createdAt: "asc" },
    });
  }
  // No team context (e.g. user has no workspace yet) — nothing to show.
  return [];
}

export async function createProject(
  name: string,
  summary?: string,
  productGoal?: string,
  teamId?: string,
) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("You must be logged in to create a project.");

  if (!teamId) {
    throw new Error("A project must be linked to one of your workspaces.");
  }

  // Make sure the user actually belongs to the workspace they're linking to,
  // so projects (and their tasks) can't be created outside the user's teams.
  const membership = await prisma.team.findFirst({
    where: { id: teamId, members: { some: { id: userId } } },
    select: { id: true },
  });
  if (!membership) {
    throw new Error("You are not a member of this workspace.");
  }

  const project = await prisma.project.create({
    data: { name, summary, productGoal, teamId },
  });

  void logActivity({
    action: "project_created",
    projectId: project.id,
    projectName: name,
    meta: { teamId },
  });

  revalidatePath("/home", "layout");
  return project;
}

export async function deleteProject(projectId: string) {
  await verifyProjectAccess(projectId);
  return prisma.project.delete({ where: { id: projectId } });
}

export async function updateProjectWorkflow(
  projectId: string,
  workflowStateJson: string,
) {
  await verifyProjectAccess(projectId);
  return prisma.project.update({
    where: { id: projectId },
    data: { workflowState: workflowStateJson },
  });
}

export async function getProjectTeamMembers(projectId: string) {
  await verifyProjectAccess(projectId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });
  return project?.team?.members ?? [];
}

export async function getTaskComments(taskId: string) {
  await verifyTaskAccess(taskId);
  return prisma.comment.findMany({
    where: { taskId },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTaskComment(taskId: string, text: string) {
  const userId = await verifyTaskAccess(taskId);

  const comment = await prisma.comment.create({
    data: { text, taskId, authorId: userId },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      creatorId: true,
      title: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });
  const commenter = await prisma.profile.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  const commenterName = commenter?.name ?? "Someone";

  // Notify assignee + creator (excluding self)
  const toNotify = new Set(
    [task?.assigneeId, task?.creatorId].filter(Boolean) as string[],
  );
  toNotify.delete(userId);
  for (const recipientId of toNotify) {
    await createNotification(
      recipientId,
      "task_comment",
      `${commenterName} commented on "${task?.title}"`,
      "/home",
    );
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { comments: { increment: 1 } },
  });

  void logActivity({
    action: "comment_added",
    projectId: task?.projectId,
    projectName: task?.project?.name,
    taskId,
    taskTitle: task?.title,
  });

  revalidatePath("/home");
  return comment;
}

export async function getTaskAttachments(taskId: string) {
  await verifyTaskAccess(taskId);
  return prisma.attachment.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addTaskAttachment(
  taskId: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
) {
  const userId = await verifyTaskAccess(taskId);

  const attachment = await prisma.attachment.create({
    data: { fileName, fileUrl, fileSize, taskId, userId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { files: { increment: 1 } },
  });

  revalidatePath("/home");
  return attachment;
}

export async function deleteTaskComment(commentId: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("You must be logged in to delete comments.");

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, taskId: true },
  });
  if (!comment) throw new Error("Comment not found.");
  if (comment.authorId !== userId)
    throw new Error("You can only delete your own comments.");

  await verifyTaskAccess(comment.taskId);

  await prisma.comment.delete({ where: { id: commentId } });
  await prisma.task.update({
    where: { id: comment.taskId },
    data: { comments: { decrement: 1 } },
  });

  revalidatePath("/home");
  return { success: true };
}

export async function deleteTaskAttachment(attachmentId: string) {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("You must be logged in to delete attachments.");

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: { userId: true, taskId: true },
  });
  if (!attachment) throw new Error("Attachment not found.");
  if (attachment.userId !== userId)
    throw new Error("You can only delete your own attachments.");

  await verifyTaskAccess(attachment.taskId);

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await prisma.task.update({
    where: { id: attachment.taskId },
    data: { files: { decrement: 1 } },
  });

  revalidatePath("/home");
  return { success: true };
}

export async function addTaskDependency(taskId: string, dependencyId: string) {
  if (taskId === dependencyId)
    throw new Error("A task cannot depend on itself.");
  await verifyTaskAccess(taskId);
  await verifyTaskAccess(dependencyId);
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { dependencies: { connect: { id: dependencyId } } },
    include: { dependencies: true },
  });
  try {
    revalidatePath("/home");
  } catch {
    /* outside Next context */
  }
  return updated;
}

export async function removeTaskDependency(
  taskId: string,
  dependencyId: string,
) {
  await verifyTaskAccess(taskId);
  await verifyTaskAccess(dependencyId);
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { dependencies: { disconnect: { id: dependencyId } } },
    include: { dependencies: true },
  });
  try {
    revalidatePath("/home");
  } catch {
    /* outside Next context */
  }
  return updated;
}