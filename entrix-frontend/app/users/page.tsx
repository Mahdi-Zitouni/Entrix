import { UserCard } from '../../components/UserCard';
import { User } from '../../types/user';

const users: User[] = [
  {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    phone: '+216 12 345 678',
    password: '',
  },
  {
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    phone: '+216 98 765 432',
    password: '',
  },
];

export default function UsersPage() {
  return (
    <main className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((user) => (
          <UserCard key={user.email} user={user} />
        ))}
      </div>
    </main>
  );
} 