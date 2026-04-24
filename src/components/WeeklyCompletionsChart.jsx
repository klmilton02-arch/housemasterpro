import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyCompletionsChart({ profiles, history }) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const chartData = profiles.map(profile => {
    const completions = history.filter(h => {
      const completedDate = new Date(h.completed_date);
      return h.family_member_id === profile.family_member_id && completedDate >= weekStart;
    }).length;
    
    return {
      name: profile.family_member_name || "Unknown",
      completions
    };
  }).sort((a, b) => b.completions - a.completions);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-heading font-semibold text-sm mb-4">Tasks Completed This Week</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
          <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}