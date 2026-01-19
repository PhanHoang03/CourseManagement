'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const adminMenuItems = [
  {
    title: 'DASHBOARD',
    items: [
      {
        icon: '/home.png',
        label: 'Dashboard',
        href: '/admin',
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      {
        icon: '/teacher.png',
        label: 'User Management',
        href: '/list/users',
      },
      {
        icon: '/class.png',
        label: 'Organizations',
        href: '/list/organizations',
      },
      {
        icon: '/subject.png',
        label: 'Departments',
        href: '/list/departments',
      },
      {
        icon: '/lesson.png',
        label: 'Course Management',
        href: '/list/courses',
      },
      {
        icon: '/student.png',
        label: 'Enrollments',
        href: '/list/enrollments',
      },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      {
        icon: '/lesson.png',
        label: 'Quiz Maker',
        href: '/ai/quiz-maker',
      },
    ],
  },
];

const AdminMenu = () => {
  const pathname = usePathname();

  return (
    <div className="mt-2 text-sm">
      {adminMenuItems.map((section) => (
        <div className="flex flex-col gap-1" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-lamaSkyLight'
                }`}
              >
                <Image src={item.icon} alt={item.label} width={20} height={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default AdminMenu;
