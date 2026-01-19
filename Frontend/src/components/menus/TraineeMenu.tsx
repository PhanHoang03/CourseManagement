'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const traineeMenuItems = [
  {
    title: 'LEARN',
    items: [
      {
        icon: '/home.png',
        label: 'Home',
        href: '/trainee',
      },
      {
        icon: '/lesson.png',
        label: 'My Courses',
        href: '/trainee/courses',
      },
      {
        icon: '/lesson.png',
        label: 'Quiz Maker',
        href: '/trainee/quiz-maker',
      },
    ],
  },
  {
    title: 'PROFILE',
    items: [
      {
        icon: '/profile.png',
        label: 'Profile',
        href: '/profile',
      },
    ],
  },
];

const TraineeMenu = () => {
  const pathname = usePathname();

  return (
    <div className="mt-2 text-sm">
      {traineeMenuItems.map((section) => (
        <div className="flex flex-col gap-1" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          {section.items.map((item) => {
            // Get all menu items to check for more specific matches
            const allMenuItems = traineeMenuItems.flatMap(s => s.items);
            
            // Check for exact match first
            if (pathname === item.href) {
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className="flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors bg-blue-50 text-blue-600"
                >
                  <Image src={item.icon} alt={item.label} width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
            
            // For non-exact matches, check if pathname starts with href + '/'
            // But only if no other menu item has a more specific match (exact or prefix)
            // Sort by length (longest first) to find the most specific match
            const sortedMenuItems = [...allMenuItems].sort((a, b) => b.href.length - a.href.length);
            
            // Find the most specific matching menu item
            const mostSpecificMatch = sortedMenuItems.find(otherItem => 
              pathname === otherItem.href || pathname?.startsWith(otherItem.href + '/')
            );
            
            // Only active if this item is the most specific match
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

export default TraineeMenu;
