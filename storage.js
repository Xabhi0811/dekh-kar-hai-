// LocalStorage helper functions for task tracker

const STORAGE_KEY = 'dailyTasksData';
const EMOJI_MAPPINGS_KEY = 'emojiMappings';

// Default emoji mappings based on completion percentage
const DEFAULT_EMOJI_MAPPINGS = [
  { min: 100, max: 100, emoji: '😀', label: 'Perfect!' },
  { min: 80, max: 99, emoji: '🙂', label: 'Great!' },
  { min: 60, max: 79, emoji: '😐', label: 'Good' },
  { min: 40, max: 59, emoji: '😕', label: 'Okay' },
  { min: 20, max: 39, emoji: '😞', label: 'Could be better' },
  { min: 0, max: 19, emoji: '😭', label: 'Needs work' }
];

export const getEmojiMappings = () => {
  const saved = localStorage.getItem(EMOJI_MAPPINGS_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_EMOJI_MAPPINGS;
};

export const saveEmojiMappings = (mappings) => {
  localStorage.setItem(EMOJI_MAPPINGS_KEY, JSON.stringify(mappings));
};

export const getEmojiForRating = (completed, total) => {
  if (total === 0) return '😐';
  const percentage = (completed / total) * 100;
  const mappings = getEmojiMappings();
  
  const match = mappings.find(m => percentage >= m.min && percentage <= m.max);
  return match ? match.emoji : '😐';
};

export const getAllDailyTasks = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

export const getDailyTasks = (date) => {
  const allData = getAllDailyTasks();
  return allData[date] || { tasks: [], rating: null, emoji: null, notes: '' };
};

export const saveDailyTasks = (date, tasksData) => {
  const allData = getAllDailyTasks();
  allData[date] = tasksData;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
};

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const calculateStats = () => {
  const allData = getAllDailyTasks();
  const dates = Object.keys(allData).sort();
  
  let totalTasks = 0;
  let completedTasks = 0;
  let totalDays = dates.length;
  const dailyRatings = [];
  const emojiCounts = {};
  
  dates.forEach(date => {
    const dayData = allData[date];
    const completed = dayData.tasks.filter(t => t.completed).length;
    const total = dayData.tasks.length;
    
    totalTasks += total;
    completedTasks += completed;
    
    if (total > 0) {
      const percentage = (completed / total) * 100;
      dailyRatings.push({ date, percentage, completed, total });
      
      const emoji = dayData.emoji || getEmojiForRating(completed, total);
      emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
    }
  });
  
  // Calculate streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = getTodayDate();
  
  for (let i = dates.length - 1; i >= 0; i--) {
    const dayData = allData[dates[i]];
    const completed = dayData.tasks.filter(t => t.completed).length;
    const total = dayData.tasks.length;
    
    if (total > 0 && completed === total) {
      tempStreak++;
      if (dates[i] === today || i === dates.length - 1) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return {
    totalTasks,
    completedTasks,
    totalDays,
    dailyRatings,
    emojiCounts,
    currentStreak,
    longestStreak,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  };
};