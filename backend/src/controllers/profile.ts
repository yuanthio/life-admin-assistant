// life-admin-assistant/backend/src/controllers/profile.ts
import { Request, Response } from "express";
import { 
  createOrUpdateProfile, 
  getUserProfile,
  createAutomatedTemplates,
  ProfileData
} from "../services/profile";
import { getUserTasks } from "../services/task";
import { prisma } from "../prisma/client"; // Tambahkan ini

export async function handleSetupProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const profileData: ProfileData = req.body;

    console.log(`Setting up profile for user ${userId}:`, profileData);

    // Update atau create profile
    const profile = await createOrUpdateProfile(userId, profileData);

    // Buat template otomatis berdasarkan profile
    const templates = await createAutomatedTemplates(userId, profileData);

    console.log(`Profile setup completed for user ${userId}, created ${templates.length} templates`);

    res.json({
      message: "Profile setup completed",
      profile,
      templates,
      success: true
    });
  } catch (err: any) {
    console.error("Setup profile error:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    res.status(400).json({ 
      message: err.message || "Failed to setup profile",
      error: err.toString(),
      success: false
    });
  }
}

export async function handleGetProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const profile = await getUserProfile(userId);

    if (!profile) {
      res.status(404).json({ 
        message: "Profile not found",
        success: false 
      });
      return;
    }

    res.json({ 
      profile,
      success: true 
    });
  } catch (err: any) {
    console.error("Get profile error:", err);
    res.status(500).json({ 
      message: "Internal server error",
      error: err.toString(),
      success: false 
    });
  }
}

export async function handleGetDashboardData(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;

    console.log(`Getting dashboard data for user ${userId}`);

    // Get profile
    const profile = await getUserProfile(userId);

    // Get tasks
    const pendingTasks = await getUserTasks(userId, { completed: false });
    const completedTasks = await getUserTasks(userId, { completed: true });

    // Group tasks by template instead of category
    const tasksByTemplate = pendingTasks.reduce((acc, task) => {
      const templateName = task.template?.name || 'Uncategorized';
      acc[templateName] = (acc[templateName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`Dashboard data retrieved for user ${userId}: ${pendingTasks.length} pending, ${completedTasks.length} completed`);

    res.json({
      profile,
      stats: {
        totalPendingTasks: pendingTasks.length,
        totalCompletedTasks: completedTasks.length,
        tasksByTemplate
      },
      pendingTasks: pendingTasks.slice(0, 10),
      completedTasks: completedTasks.slice(0, 5),
      success: true
    });
  } catch (err: any) {
    console.error("Get dashboard error:", {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ 
      message: "Internal server error",
      error: err.toString(),
      success: false 
    });
  }
}

// TAMBAHKAN FUNCTION BARU INI
export async function handleCheckUserTemplates(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    
    // Hitung jumlah template yang dimiliki user
    const templateCount = await prisma.template.count({
      where: { userId }
    });
    
    // Hitung jumlah profile yang dimiliki user
    const profileCount = await prisma.profile.count({
      where: { userId }
    });
    
    console.log(`User ${userId} has ${templateCount} templates and ${profileCount} profile`);
    
    res.json({
      hasTemplates: templateCount > 0,
      hasProfile: profileCount > 0,
      templateCount,
      profileCount,
      success: true
    });
  } catch (err: any) {
    console.error("Check user templates error:", err);
    res.status(500).json({ 
      message: "Internal server error",
      error: err.toString(),
      success: false 
    });
  }
}