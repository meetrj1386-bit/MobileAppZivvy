const manifestations = {
  morning: [
    {
      title: "Today's Affirmation",
      message: "Your child is capable of amazing progress. Every small step counts.",
      visualization: "Picture your child smiling and engaged in today's activities."
    },
    {
      title: "Growth Mindset",
      message: "Challenges are opportunities for growth. Your patience creates miracles.",
      visualization: "Imagine celebrating a breakthrough moment today."
    }
  ],
  evening: [
    {
      title: "Reflect & Appreciate",
      message: "Notice one thing your child did well today, no matter how small.",
      visualization: "Feel gratitude for the progress made."
    },
    {
      title: "Tomorrow's Success",
      message: "Rest knowing tomorrow brings new opportunities for growth.",
      visualization: "Visualize peaceful sleep and energized morning."
    }
  ]
};

export const getDailyManifestation = (timeOfDay = 'morning') => {
  const pool = manifestations[timeOfDay];
  const today = new Date().getDay();
  return pool[today % pool.length];
};

export const scheduleManifestations = async () => {
  // Morning: 7 AM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Morning Manifestation 🌅",
      body: getDailyManifestation('morning').message,
    },
    trigger: {
      hour: 7,
      minute: 0,
      repeats: true,
    },
  });
  
  // Evening: 9 PM
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Evening Reflection 🌙",
      body: getDailyManifestation('evening').message,
    },
    trigger: {
      hour: 21,
      minute: 0,
      repeats: true,
    },
  });
};