import { adminDB } from "./firebase-admin";
import { Plan, WorkspaceWithPlan, PlanId } from "@/types/billing";

/**
 * Fetches a workspace with its associated plan metadata
 * @param workspaceId - The workspace document ID
 * @returns Workspace data with plan metadata
 */
export async function getWorkspacePlan(
  workspaceId: string
): Promise<WorkspaceWithPlan> {
  // Fetch workspace
  const workspaceDoc = await adminDB
    .collection("workspaces")
    .doc(workspaceId)
    .get();

  if (!workspaceDoc.exists) {
    throw new Error("Workspace not found");
  }

  const workspaceData = workspaceDoc.data()!;
  
  // Default to free plan if not set
  const planId: PlanId = workspaceData.planId || "free";

  // Fetch plan metadata
  const planDoc = await adminDB.collection("plans").doc(planId).get();

  if (!planDoc.exists) {
    throw new Error(`Plan ${planId} not found in /plans collection`);
  }

  const planData = planDoc.data() as Plan;

  return {
    id: workspaceDoc.id,
    workspaceName: workspaceData.workspaceName || "My Workspace",
    planId,
    planRef: `/plans/${planId}`,
    credits: workspaceData.credits || 0,
    ownerUid: workspaceData.ownerUid,
    members: workspaceData.members || [],
    memberIds: workspaceData.memberIds || [],
    invited: workspaceData.invited || [],
    createdAt: workspaceData.createdAt,
    updatedAt: workspaceData.updatedAt,
    plan: planData
  };
}
