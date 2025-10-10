const axios = require('axios');

// API configuration
const BASE_URL = 'http://localhost:1849';
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InN1cGVyYWRtaW4iLCJzdWIiOiI2OGIxNDgxNDAwZWI4NjU5MDY1MzA3ZWEiLCJpYXQiOjE3NjAwNzIwNzksImV4cCI6MTc2MDE1ODQ3OX0.fD_jjX8xk47OR6kVFDqzMxGThEq3EI3R_XzoBa6Dxfc';

// Application categorization rules
const categorizeApplication = (name) => {
  const lowerName = name.toLowerCase();

  // Browser applications
  if (
    lowerName.includes('chrome') ||
    lowerName.includes('firefox') ||
    lowerName.includes('edge') ||
    lowerName.includes('safari')
  ) {
    return {
      tag: 'office',
      description:
        "Veb-brauzer dasturi - internetda saytlarni ko'rish va veb-ilovalar bilan ishlash uchun",
    };
  }

  // Microsoft Office applications
  if (
    lowerName.includes('word') ||
    lowerName.includes('excel') ||
    lowerName.includes('powerpoint') ||
    lowerName.includes('outlook') ||
    lowerName.includes('office') ||
    lowerName.includes('wps')
  ) {
    return {
      tag: 'office',
      description:
        'Microsoft Office dasturi - hujjatlar, jadvallar va taqdimotlar bilan ishlash uchun',
    };
  }

  // Windows system applications
  if (
    lowerName.includes('cmd') ||
    lowerName.includes('calc') ||
    lowerName.includes('notepad') ||
    lowerName.includes('explorer') ||
    lowerName.includes('taskmgr') ||
    lowerName.includes('cleanmgr') ||
    lowerName.includes('audiodg') ||
    lowerName.includes('backgroundtaskhost') ||
    lowerName.includes('bdeuisrv')
  ) {
    return {
      tag: 'windows',
      description:
        'Windows operatsion tizimining tarkibiy qismi - tizim funksiyalarini bajarish uchun',
    };
  }

  // Gaming applications
  if (
    lowerName.includes('steam') ||
    lowerName.includes('game') ||
    lowerName.includes('gaming') ||
    lowerName.includes('am_delta') ||
    lowerName.includes('am_engine') ||
    lowerName.includes('aitagent')
  ) {
    return {
      tag: 'game',
      description:
        "O'yin dasturi - o'yinlar o'ynash va gaming platformasi bilan ishlash uchun",
    };
  }

  // Social media applications
  if (
    lowerName.includes('telegram') ||
    lowerName.includes('whatsapp') ||
    lowerName.includes('discord') ||
    lowerName.includes('skype') ||
    lowerName.includes('zoom') ||
    lowerName.includes('social')
  ) {
    return {
      tag: 'social',
      description:
        'Ijtimoiy tarmoq dasturi - foydalanuvchilar bilan aloqa qilish va xabarlar almashish uchun',
    };
  }

  // Security applications
  if (
    lowerName.includes('360') ||
    lowerName.includes('antivirus') ||
    lowerName.includes('security') ||
    lowerName.includes('kms') ||
    lowerName.includes('autokms')
  ) {
    return {
      tag: 'system',
      description:
        'Xavfsizlik dasturi - kompyuterni viruslardan himoya qilish va tizimni himoya qilish uchun',
    };
  }

  // Development tools
  if (
    lowerName.includes('git') ||
    lowerName.includes('node') ||
    lowerName.includes('npm') ||
    lowerName.includes('code') ||
    lowerName.includes('studio') ||
    lowerName.includes('dev')
  ) {
    return {
      tag: 'office',
      description:
        'Dasturlash vositasi - kod yozish va dasturlash loyihalari bilan ishlash uchun',
    };
  }

  // Media applications
  if (
    lowerName.includes('media') ||
    lowerName.includes('player') ||
    lowerName.includes('vlc') ||
    lowerName.includes('video') ||
    lowerName.includes('audio') ||
    lowerName.includes('music')
  ) {
    return {
      tag: 'social',
      description:
        "Media dasturi - video, audio fayllarni ko'rish va tinglash uchun",
    };
  }

  // Default category
  return {
    tag: 'windows',
    description:
      'Windows dasturi - kompyuter bilan ishlash uchun asosiy dastur',
  };
};

// Update application function
const updateApplication = async (appId, name, tag, description) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/applications/${appId}`,
      { tag, description },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log(`✅ Updated: ${name} -> ${tag}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Error updating ${name}:`,
      error.response?.data || error.message,
    );
    return null;
  }
};

// Main function
const updateAllApplications = async () => {
  try {
    console.log('🔄 Fetching all applications...');

    // Get all applications
    const response = await axios.get(
      `${BASE_URL}/applications?page=1&limit=100000`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const applications = response.data.data;
    console.log(`📊 Found ${applications.length} applications`);

    let updated = 0;
    let skipped = 0;

    for (const app of applications) {
      // Skip if already has tag and description
      if (app.tag && app.description) {
        console.log(`⏭️  Skipped: ${app.name} (already categorized)`);
        skipped++;
        continue;
      }

      // Categorize application
      const category = categorizeApplication(app.name);

      // Update application
      const result = await updateApplication(
        app._id,
        app.name,
        category.tag,
        category.description,
      );

      if (result) {
        updated++;
      }

      // Add small delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Update completed!`);
    console.log(`✅ Updated: ${updated} applications`);
    console.log(`⏭️  Skipped: ${skipped} applications`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the script
updateAllApplications();
