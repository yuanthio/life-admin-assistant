// life-admin-assistant/backend/src/services/profile.ts
import { prisma } from "../prisma/client";

export interface ProfileData {
  vehicleType?: string;
  hasPassport?: boolean;
  hasDrivingLicense?: boolean;
  hasIdCard?: boolean;
  householdSize?: number;
  houseOwnership?: string;
  billReminders?: boolean;
}

export async function createOrUpdateProfile(userId: number, data: ProfileData) {
  const existingProfile = await prisma.profile.findUnique({
    where: { userId }
  });

  if (existingProfile) {
    return await prisma.profile.update({
      where: { userId },
      data
    });
  } else {
    return await prisma.profile.create({
      data: {
        userId,
        ...data
      }
    });
  }
}

export async function createPersonalDocumentsTemplate(userId: number) {
  const template = await prisma.template.create({
    data: {
      name: "👨‍💼 Dokumen Pribadi",
      description: "Template untuk mengelola dokumen pribadi yang perlu diperpanjang",
      userId,
      isActive: true
    }
  });

  // Buat tasks otomatis untuk template dokumen pribadi
  const tasks = [
    {
      title: "Perpanjang SIM",
      description: "Perpanjang Surat Izin Mengemudi",
      frequency: "yearly",
      priority: "high",
      dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    },
    {
      title: "Perpanjang KTP",
      description: "Perpanjang Kartu Tanda Penduduk jika perlu",
      frequency: "yearly",
      priority: "medium",
      dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5))
    },
    {
      title: "Perpanjang Paspor",
      description: "Perpanjang paspor sebelum expired",
      frequency: "yearly",
      priority: "medium",
      dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5))
    },
    {
      title: "Arsipkan Dokumen Penting",
      description: "Scan dan arsipkan dokumen penting",
      frequency: "monthly",
      priority: "low"
    }
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        userId,
        templateId: template.id
      }
    });
  }

  return template;
}

export async function createHouseholdTemplate(userId: number, householdSize: number = 1) {
  const template = await prisma.template.create({
    data: {
      name: "🏠 Rumah Tangga",
      description: "Template untuk mengelola tugas rumah tangga sehari-hari",
      userId,
      isActive: true
    }
  });

  // Buat tasks otomatis untuk template rumah tangga
  const tasks = [
    {
      title: "Cuci Baju",
      description: "Mencuci pakaian (2x seminggu)",
      frequency: "weekly",
      priority: "medium"
    },
    {
      title: "Bersihkan Kamar",
      description: "Membersihkan kamar tidur (1x seminggu)",
      frequency: "weekly",
      priority: "medium"
    },
    {
      title: "Ganti Sprei",
      description: "Mengganti sprei tempat tidur (2 minggu sekali)",
      frequency: "weekly",
      priority: "low"
    },
    {
      title: "Buang Sampah",
      description: "Membuang sampah rumah tangga (setiap malam)",
      frequency: "daily",
      priority: "high"
    },
    {
      title: "Beli Kebutuhan Rumah",
      description: "Belanja kebutuhan rumah bulanan",
      frequency: "monthly",
      priority: "medium"
    }
  ];

  for (const taskData of tasks) {
    await prisma.task.create({
      data: {
        ...taskData,
        userId,
        templateId: template.id
      }
    });
  }

  return template;
}

export async function createAutomatedTemplates(userId: number, profileData: ProfileData) {
  const templates = [];
  
  // Selalu buat template rumah tangga
  templates.push(await createHouseholdTemplate(userId, profileData.householdSize));
  
  // Buat template dokumen pribadi jika pengguna memiliki dokumen terkait
  if (profileData.hasDrivingLicense || profileData.hasIdCard || profileData.hasPassport) {
    templates.push(await createPersonalDocumentsTemplate(userId));
  }

  return templates;
}

export async function getUserProfile(userId: number) {
  return await prisma.profile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });
}