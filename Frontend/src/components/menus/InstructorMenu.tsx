'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const instructorMenuItems = [
  {
    title: 'DASHBOARD',
    items: [
      {
        icon: '/home.png',
        label: 'Dashboard',
        href: '/instructor',
      },
    ],
  },
  {
    title: 'COURSES',
    items: [
      {
        icon: '/lesson.png',
        label: 'My Courses',
        href: '/instructor/courses',
      },
    ],
  },
  {
    title: 'STUDENTS',
    items: [
      {
        icon: '/student.png',
        label: 'Students',
        href: '/list/users',
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

const InstructorMenu = () => {
  const pathname = usePathname();

  return (
    <div className="mt-2 text-sm">
      {instructorMenuItems.map((section) => (
        <div className="flex flex-col gap-1" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          {section.items.map((item) => {
            // Prevent parent routes (e.g. /instructor) from staying active on child routes
            const allMenuItems = instructorMenuItems.flatMap((s) => s.items);
            const sortedMenuItems = [...allMenuItems].sort((a, b) => b.href.length - a.href.length);
            const mostSpecificMatch = sortedMenuItems.find(
              (otherItem) => pathname === otherItem.href || pathname?.startsWith(otherItem.href + "/")
            );
            const isActive = mostSpecificMatch?.href === item.href;
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

export default InstructorMenu;
