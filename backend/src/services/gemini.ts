// life-admin-assistant/backend/src/services/gemini.ts
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCETIEl2YQKqASf7Q6pUwMCPKnmEdhLEuQ";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface ChecklistStep {
  description: string;
  link?: string;
  serviceName?: string;
}

export interface GeneratedChecklist {
  steps: ChecklistStep[];
  serviceType: string;
  mainServiceUrl?: string;
}

export async function generateChecklistFromTask(
  taskTitle: string,
  taskDescription?: string,
  templateName?: string
): Promise<GeneratedChecklist> {
  try {
    console.log(`Generating checklist for task: ${taskTitle}`);
    
    const prompt = `
    Saya memiliki tugas: "${taskTitle}"
    ${taskDescription ? `Deskripsi: ${taskDescription}` : ''}
    ${templateName ? `Kategori: ${templateName}` : ''}

    Tolong generate checklist langkah-langkah untuk menyelesaikan tugas ini.
    Berikan langkah-langkah yang detail dan praktis.
    
    JIKA tugas ini terkait dengan layanan pemerintah atau perusahaan publik (seperti PLN, BPJS, SIM, PDAM, dll),
    sertakan juga link resmi untuk setiap langkah jika memungkinkan.

    Format response JSON dengan struktur berikut:
    {
      "serviceType": "tipe_layanan" (contoh: "SIM", "PLN", "BPJS", "PDAM", "lainnya"),
      "mainServiceUrl": "link_utama_layanan_jika_ada",
      "steps": [
        {
          "description": "langkah 1",
          "link": "https://link-resmi-jika-ada.com",
          "serviceName": "nama_layanan"
        },
        {
          "description": "langkah 2",
          "link": null,
          "serviceName": null
        }
      ]
    }

    Contoh untuk tugas "Perpanjang SIM":
    {
      "serviceType": "SIM",
      "mainServiceUrl": "https://sim.korlantas.polri.go.id",
      "steps": [
        {
          "description": "Persiapkan dokumen: KTP asli, SIM lama, SKCK jika diperlukan",
          "link": "https://sim.korlantas.polri.go.id/persyaratan",
          "serviceName": "Korlantas Polri"
        },
        {
          "description": "Isi formulir permohonan perpanjangan SIM online atau offline",
          "link": "https://sim.korlantas.polri.go.id/pendaftaran",
          "serviceName": "Korlantas Polri"
        },
        {
          "description": "Lakukan pemeriksaan kesehatan di klinik/rumah sakit terdaftar",
          "link": null,
          "serviceName": null
        },
        {
          "description": "Bayar biaya perpanjangan di bank/ATM yang ditentukan",
          "link": "https://sim.korlantas.polri.go.id/pembayaran",
          "serviceName": "Korlantas Polri"
        },
        {
          "description": "Ambil foto dan sidik jari di Satpas setempat",
          "link": null,
          "serviceName": null
        },
        {
          "description": "Ikuti ujian teori dan praktik (jika diperlukan)",
          "link": null,
          "serviceName": null
        },
        {
          "description": "Ambil SIM baru di kantor Satpas",
          "link": null,
          "serviceName": null
        }
      ]
    }

    Contoh untuk tugas "Bayar Tagihan PLN":
    {
      "serviceType": "PLN",
      "mainServiceUrl": "https://www.pln.co.id",
      "steps": [
        {
          "description": "Cek tagihan melalui aplikasi PLN Mobile atau website",
          "link": "https://web.pln.co.id",
          "serviceName": "PLN"
        },
        {
          "description": "Catat nomor ID pelanggan dan jumlah tagihan",
          "link": null,
          "serviceName": null
        },
        {
          "description": "Bayar melalui: Bank/ATM, Minimarket, Aplikasi E-Wallet",
          "link": "https://www.pln.co.id/portal/cara-bayar",
          "serviceName": "PLN"
        },
        {
          "description": "Simpan bukti pembayaran",
          "link": null,
          "serviceName": null
        },
        {
          "description": "Verifikasi pembayaran di aplikasi PLN Mobile",
          "link": "https://web.pln.co.id/cektagihan",
          "serviceName": "PLN"
        }
      ]
    }

    Sekarang generate untuk tugas: "${taskTitle}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // TypeScript safe handling of response
    const text = response.text;
    
    if (!text) {
      console.error("AI response is empty");
      throw new Error("AI returned empty response");
    }
    
    console.log("AI Response text:", text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", text);
      throw new Error("Failed to parse AI response: No JSON found");
    }

    const jsonString = jsonMatch[0];
    console.log("Extracted JSON:", jsonString);
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("JSON string:", jsonString);
      throw new Error("Failed to parse AI response: Invalid JSON");
    }
    
    if (!parsedData.steps || !Array.isArray(parsedData.steps)) {
      console.error("Invalid steps in AI response:", parsedData);
      throw new Error("AI response missing steps array");
    }
    
    return {
      serviceType: parsedData.serviceType || "lainnya",
      mainServiceUrl: parsedData.mainServiceUrl,
      steps: parsedData.steps.map((step: any) => ({
        description: step.description || "",
        link: step.link || undefined,
        serviceName: step.serviceName || undefined
      }))
    };
  } catch (error) {
    console.error("Error generating checklist:", error);
    
    // Fallback checklist jika AI gagal
    return {
      serviceType: "lainnya",
      steps: [
        { description: "Persiapkan dokumen yang diperlukan" },
        { description: "Isi formulir atau dokumen yang dibutuhkan" },
        { description: "Verifikasi data dan informasi" },
        { description: "Lakukan pembayaran jika diperlukan" },
        { description: "Ambil berkas/tanda terima" },
        { description: "Simpan dokumen dengan baik" }
      ]
    };
  }
}

// Mapping service types to common URLs
export const serviceUrls: Record<string, string> = {
  "SIM": "https://sim.korlantas.polri.go.id",
  "PLN": "https://www.pln.co.id",
  "BPJS": "https://www.bpjs-kesehatan.go.id",
  "PDAM": "https://pdam.co.id",
  "PDAM-JAKARTA": "https://pamjaya.co.id",
  "LISTRIK": "https://www.pln.co.id",
  "AIR": "https://pdam.co.id",
  "KTP": "https://www.dukcapil.kemendagri.go.id",
  "PASSPORT": "https://www.imigrasi.go.id",
  "PAJAK": "https://www.pajak.go.id",
  "BPJSTK": "https://www.bpjsketenagakerjaan.go.id",
  "BPN": "https://www.bpn.go.id",
  "BANK": "https://www.bi.go.id",
  "TELKOM": "https://www.telkom.co.id",
  "INDIHOME": "https://www.indihome.co.id",
  "INTERNET": "https://www.indihome.co.id",
  "TV": "https://www.indihome.co.id",
  "SAMSAT": "https://samsat.korlantas.polri.go.id",
  "STNK": "https://samsat.korlantas.polri.go.id",
  "PBB": "https://www.pajak.go.id/pbb",
  "PDAM-BANDUNG": "https://www.pdambandung.co.id",
  "PDAM-SURABAYA": "https://www.pdamsby.co.id"
};

// Fungsi untuk mendeteksi service type dari task title
export function detectServiceType(taskTitle: string): string {
  const title = taskTitle.toLowerCase();
  
  if (title.includes('sim') || title.includes('surat izin mengemudi')) return 'SIM';
  if (title.includes('pln') || title.includes('listrik')) return 'PLN';
  if (title.includes('bpjs')) return 'BPJS';
  if (title.includes('pdam') || title.includes('air')) return 'PDAM';
  if (title.includes('ktp')) return 'KTP';
  if (title.includes('paspor') || title.includes('passport')) return 'PASSPORT';
  if (title.includes('pajak')) return 'PAJAK';
  if (title.includes('stnk') || title.includes('samsat')) return 'STNK';
  if (title.includes('indihome') || title.includes('telkom')) return 'INDIHOME';
  if (title.includes('bpjs ketenagakerjaan') || title.includes('jamsostek')) return 'BPJSTK';
  if (title.includes('dukcapil') || title.includes('kk') || title.includes('kartu keluarga')) return 'KTP';
  if (title.includes('imigrasi') || title.includes('visa')) return 'PASSPORT';
  
  return 'lainnya';
}