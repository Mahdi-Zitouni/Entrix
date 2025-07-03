import { User } from '../types/user';

export function UserCard({ user }: { user: User }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-6 flex flex-col items-center gap-2 transition-transform hover:scale-105 hover:shadow-lg">
      {user.avatar && (
        <img src={user.avatar} alt={user.firstName + ' ' + user.lastName} className="w-20 h-20 rounded-full object-cover border-2 border-primary mb-2" />
      )}
      <div className="font-bold text-lg text-primary mb-1">{user.firstName} {user.lastName}</div>
      <div className="text-muted-foreground text-sm">{user.email}</div>
      {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
    </div>
  );
} 