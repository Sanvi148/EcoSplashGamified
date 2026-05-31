 import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '../supabaseClient';

interface EcoContributionCalendarProps {
  className?: string;
}

const EcoContributionCalendar = ({ className = '' }: EcoContributionCalendarProps) => {
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    activeDays: 0,
    totalActions: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  // 🗓 Fetch activity from Supabase
  useEffect(() => {
  const fetchActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    const formattedStart = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('eco_activity')
      .select('active_date')
      .eq('user_id', user.id)
      .gte('active_date', formattedStart);

    if (!error && data) {
      const map: Record<string, number> = {};
      data.forEach(({ active_date }) => {
        // Normalize date to YYYY-MM-DD
        const dateKey = new Date(active_date).toISOString().split('T')[0];
        map[dateKey] = (map[dateKey] || 0) + 1;
      });
      setActivityMap(map);
      calculateStreaks(map);
    }
  };

  fetchActivity();

  // Supabase realtime subscription
  const channel = supabase
    .channel('realtime:eco_activity')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'eco_activity' },
      () => fetchActivity()
    )
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  // 🌿 Calculate streaks (current + longest)
  const calculateStreaks = (map: Record<string, number>) => {
    const dates = Object.keys(map).sort();
    if (dates.length === 0) {
      setStats({ activeDays: 0, totalActions: 0, currentStreak: 0, longestStreak: 0 });
      return;
    }

    let longest = 1;
    let current = 1;
    const totalActions = Object.values(map).reduce((a, b) => a + b, 0);
    const activeDays = dates.length;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) current++;
      else current = 1;
      longest = Math.max(longest, current);
    }

    // Check if streak continues to today
    const lastDate = new Date(dates[dates.length - 1]);
    const today = new Date();
    const gap = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (gap > 1) current = 0;

    setStats({ activeDays, totalActions, currentStreak: current, longestStreak: longest });
  };

  // Generate 6-month labels
  const months = Array.from({ length: 6 }, (_, i) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - (5 - i));

  return {
    label: date.toLocaleString('default', { month: 'short' }),
    key: `${date.getFullYear()}-${date.getMonth()}`
  };
});
  console.log(months);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Color intensity based on actions/day
  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-slate-200 dark:bg-slate-700';
    if (count === 1) return 'bg-emerald-100 dark:bg-emerald-800';
    if (count === 2) return 'bg-emerald-200 dark:bg-emerald-700';
    if (count === 3) return 'bg-emerald-300 dark:bg-emerald-600';
    return 'bg-emerald-400 dark:bg-emerald-500';
  };

  // Build grid for past 6 months
  const generateCalendarData = () => {
    const today = new Date();
    const data: number[][] = [];
    const daysPerWeek = 7;
    const totalWeeks = 6 * 4;

    for (let w = 0; w < totalWeeks; w++) {
      const weekData: number[] = [];
      for (let d = 0; d < daysPerWeek; d++) {
        const day = new Date();
        day.setDate(today.getDate() - (totalWeeks * 7 - (w * 7 + d)));
        const key = day.toISOString().split('T')[0];
        weekData.push(activityMap[key] || 0);
      }
      data.push(weekData);
    }

    return data;
  };

  const data = generateCalendarData();

  return (
    <Card className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-emerald-200 dark:border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <Star size={24} />
          Eco Contribution Calendar
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Month labels */}
          <div className="flex justify-between items-center">
            {months.map((month) => (
              <div key={month.key} className="text-sm text-gray-600 dark:text-gray-400 flex-1 text-center">
                {month.label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              <div className="h-3"></div>
              {days.map((day, index) => (
                <div 
                  key={day}
                  className={`text-xs text-gray-600 dark:text-gray-400 h-3 flex items-center ${
                    index % 2 === 1 ? 'opacity-0' : ''
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar weeks */}
            <div className="flex gap-1 flex-1">
              {data.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1 flex-1">
                  {week.map((count, dayIndex) => (
                    <motion.div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm ${getActivityColor(count)} cursor-pointer`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005, duration: 0.2 }}
                      whileHover={{ scale: 1.2, transition: { duration: 0.1 } }}
                      title={count === 0 ? 'No activity' : `${count} eco-actions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`} />
              ))}
            </div>
            <span>More</span>
          </div>

          {/* Dynamic stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-2xl text-emerald-600 dark:text-emerald-400">{stats.totalActions}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-emerald-600 dark:text-emerald-400">{stats.longestStreak}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Longest streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-emerald-600 dark:text-emerald-400">{stats.currentStreak}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Current streak</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EcoContributionCalendar;