import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, Users, IndianRupee } from 'lucide-react';
import api from '../../services/api';

interface Stats {
  revenue?: number;
  orders?: number;
  customers?: number;
  products?: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({});

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/analytics');

        setStats(response.data.stats || response.data || {});
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }
    };

    loadStats();
  }, []);

  const cards = [
    {
      title: 'Revenue',
      value: `₹${(
        stats.revenue || 0
      ).toLocaleString('en-IN')}`,
      icon: IndianRupee,
    },
    {
      title: 'Orders',
      value: stats.orders || 0,
      icon: ShoppingBag,
    },
    {
      title: 'Customers',
      value: stats.customers || 0,
      icon: Users,
    },
    {
      title: 'Products',
      value: stats.products || 0,
      icon: Package,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div>
        <p className="text-sm text-gray-500">
          Admin Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-semibold">
          Overview
        </h1>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-2xl border bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {card.title}
                </span>

                <Icon
                  size={20}
                  className="text-gray-400"
                />
              </div>

              <p className="mt-4 text-3xl font-semibold">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;