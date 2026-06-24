import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../api';
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

const Collections = () => {
  const [filter, setFilter] = useState('all');
  
  // Fetch ALL loans with their schedules
  const { data: loans, isLoading, refetch } = useQuery({
    queryKey: ['loans-with-schedules'],
    queryFn: () => loanAPI.getAll({ limit: 1000 }), // Get all loans
  });

  if (isLoading) return <Loading />;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const allLoans = loans?.data?.results || [];
  
  console.log('All loans:', allLoans);
  
  // Collect all schedules from all loans
  const allSchedules = [];
  allLoans.forEach(loan => {
    if (loan.schedules && loan.schedules.length > 0) {
      loan.schedules.forEach(schedule => {
        // Only include pending or overdue schedules
        if (schedule.status === 'pending' || schedule.status === 'overdue' || schedule.status === 'partial') {
          allSchedules.push({
            ...schedule,
            loan: loan,
            customer: loan.customer_details || loan.customer
          });
        }
      });
    }
  });

  console.log('All schedules:', allSchedules);

  // Filter schedules based on selection
  const filteredSchedules = allSchedules.filter(item => {
    if (filter === 'today') {
      return item.due_date === todayStr;
    } else if (filter === 'tomorrow') {
      return item.due_date === tomorrowStr;
    } else if (filter === 'overdue') {
      return item.status === 'overdue';
    } else if (filter === 'defaulted') {
      return item.loan?.status === 'defaulted';
    }
    return true;
  });

  // Calculate stats
  const dueToday = allSchedules.filter(c => c.due_date === todayStr);
  const dueTomorrow = allSchedules.filter(c => c.due_date === tomorrowStr);
  const overdue = allSchedules.filter(c => c.status === 'overdue');
  const defaulters = allLoans.filter(l => l.status === 'defaulted');

  const stats = [
    { 
      name: 'Due Today', 
      count: dueToday.length,
      total: dueToday.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0),
      color: '#f59e0b',
      icon: '📅'
    },
    { 
      name: 'Due Tomorrow', 
      count: dueTomorrow.length,
      total: dueTomorrow.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0),
      color: '#3b82f6',
      icon: '📆'
    },
    { 
      name: 'Overdue', 
      count: overdue.length,
      total: overdue.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0),
      color: '#ef4444',
      icon: '⚠️'
    },
    { 
      name: 'Defaulters', 
      count: defaulters.length,
      total: defaulters.reduce((sum, l) => sum + (parseFloat(l.outstanding_balance) || 0), 0),
      color: '#dc2626',
      icon: '🚫'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Collections Dashboard</h1>
        <button onClick={() => refetch()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Refresh Data
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {stats.map((stat) => (
          <div key={stat.name} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stat.count}</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>{formatCurrency(stat.total)}</p>
              </div>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Collection Summary */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Real-Time Collection Status</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-500">Today's Collections</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(0)}</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-500">Expected Today</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(dueToday.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0))}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-500">Overdue Amount</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(overdue.reduce((sum, c) => sum + (parseFloat(c.total_due) || 0), 0))}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-500">Collection Rate</p>
            <p className="text-xl font-bold text-blue-600">0%</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        background: 'white',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'all' ? '#0284c7' : 'transparent',
            color: filter === 'all' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          All Collections
        </button>
        <button
          onClick={() => setFilter('today')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'today' ? '#f59e0b' : 'transparent',
            color: filter === 'today' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Due Today ({dueToday.length})
        </button>
        <button
          onClick={() => setFilter('tomorrow')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'tomorrow' ? '#3b82f6' : 'transparent',
            color: filter === 'tomorrow' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Due Tomorrow ({dueTomorrow.length})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'overdue' ? '#ef4444' : 'transparent',
            color: filter === 'overdue' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Overdue ({overdue.length})
        </button>
        <button
          onClick={() => setFilter('defaulted')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: 'none',
            background: filter === 'defaulted' ? '#dc2626' : 'transparent',
            color: filter === 'defaulted' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Defaulters ({defaulters.length})
        </button>
      </div>

      {/* Collections Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Customer</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Loan</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Installment</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Due Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Penalty</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Total</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length > 0 ? (
                filteredSchedules.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '500' }}>
                        {item.customer?.first_name || 'Unknown'} {item.customer?.last_name || ''}
                      </span>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.customer?.phone || ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                      {item.loan?.loan_no || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                      #{item.installment_no} of {item.loan?.term_months || 0}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      {formatDate(item.due_date)}
                      {item.due_date === todayStr && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          background: '#fef3c7',
                          borderRadius: '12px',
                          fontSize: '10px',
                          color: '#d97706'
                        }}>
                          Today
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(item.total_due || 0)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#ef4444' }}>
                      {formatCurrency(item.penalty_amount || 0)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency((parseFloat(item.total_due) || 0) + (parseFloat(item.penalty_amount) || 0))}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: item.status === 'overdue' ? '#fef2f2' : 
                                   item.status === 'partial' ? '#eff6ff' : '#fef3c7',
                        color: item.status === 'overdue' ? '#dc2626' : 
                               item.status === 'partial' ? '#2563eb' : '#d97706'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Link
                        to={`/payments/new?loan=${item.loan?.id}`}
                        style={{
                          padding: '6px 16px',
                          background: '#0284c7',
                          color: 'white',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '14px',
                          display: 'inline-block'
                        }}
                      >
                        Receive
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    No collection records found. Make sure you have:
                    <br />
                    1. Active loans with repayment schedules
                    <br />
                    2. Payments that are due or overdue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Collections;