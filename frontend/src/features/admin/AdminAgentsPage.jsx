import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { CreateAgentModal } from './CreateAgentModal.jsx';
import { EditAgentModal } from './EditAgentModal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getErrorMessage } from '../../lib/errors.js';
import {
  Users,
  UserPlus,
  Search,
  MapPin,
  Edit2,
  RefreshCw,
  Power,
} from 'lucide-react';

export function AdminAgentsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [isTogglingId, setIsTogglingId] = useState(null);

  const toast = useToast();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin_agents'],
    queryFn: () => adminApi.listAgents(),
  });

  const rawAgents = data?.items || (Array.isArray(data) ? data : []);

  // Filter list
  const filteredAgents = rawAgents.filter((agent) => {
    // Availability filter
    if (availabilityFilter === 'AVAILABLE' && !agent.isAvailable) return false;
    if (availabilityFilter === 'UNAVAILABLE' && agent.isAvailable) return false;

    // Search filter
    if (!searchInput.trim()) return true;
    const q = searchInput.trim().toLowerCase();
    const name = (agent.fullName || '').toLowerCase();
    const email = (agent.email || '').toLowerCase();
    const phone = (agent.phone || '').toLowerCase();
    const zoneName = (agent.assignedZone?.name || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || zoneName.includes(q);
  });

  const queryClient = useQueryClient();

  const handleToggleAvailability = async (agent) => {
    setIsTogglingId(agent.id);
    const targetState = !agent.isAvailable;
    try {
      await adminApi.updateAgent(agent.id, {
        isAvailable: targetState,
      });
      toast.success(
        `Agent ${agent.fullName} is now ${targetState ? 'AVAILABLE for dispatches' : 'OFF-DUTY'}.`
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin_agents'] }),
        queryClient.invalidateQueries({ queryKey: ['admin_overview_agents'] }),
        queryClient.invalidateQueries({ queryKey: ['admin_dispatch_queue'] }),
      ]);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update agent availability.'));
    } finally {
      setIsTogglingId(null);
    }
  };

  const totalAgents = rawAgents.length;
  const availableAgents = rawAgents.filter((a) => a.isAvailable).length;

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="label-caps text-xs text-ink-variant">Fleet Management</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Couriers & Field Agents
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add Courier
            </Button>
          </div>
        </div>

        {/* Filter and Metrics Strip */}
        <div className="bg-container-lowest hairline rounded-lg p-4 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by courier name, phone, or zone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-container-low text-xs text-ink placeholder:text-ink-variant/50 rounded pl-9 pr-3 py-2 hairline focus:outline-none focus:bg-container-lowest focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 self-center sm:self-auto">
            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-container-low p-1 rounded hairline">
              <button
                onClick={() => setAvailabilityFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  availabilityFilter === 'ALL'
                    ? 'bg-container-lowest text-ink shadow-xs'
                    : 'text-ink-variant hover:text-ink'
                }`}
              >
                All ({totalAgents})
              </button>
              <button
                onClick={() => setAvailabilityFilter('AVAILABLE')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  availabilityFilter === 'AVAILABLE'
                    ? 'bg-container-lowest text-ink shadow-xs'
                    : 'text-ink-variant hover:text-ink'
                }`}
              >
                Available ({availableAgents})
              </button>
              <button
                onClick={() => setAvailabilityFilter('UNAVAILABLE')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  availabilityFilter === 'UNAVAILABLE'
                    ? 'bg-container-lowest text-ink shadow-xs'
                    : 'text-ink-variant hover:text-ink'
                }`}
              >
                Off-Duty ({totalAgents - availableAgents})
              </button>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-container-lowest hairline rounded-lg shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <p className="text-xs text-danger mb-3">Failed to load delivery couriers.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-12 px-6">
              <EmptyState
                title="No couriers found"
                description={
                  searchInput
                    ? 'No field agents match your search filter.'
                    : 'No courier accounts have been created yet.'
                }
                actionLabel="Create Field Agent"
                onAction={() => setIsCreateOpen(true)}
                icon={<Users className="w-6 h-6" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface border-b border-hairline text-ink-variant">
                    <th className="py-3 px-4 sm:px-6 label-caps text-[10px]">Courier Identity</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Assigned Zone</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Capacity & Load</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right label-caps text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredAgents.map((agent) => {
                    const activeCount = agent.currentActiveDeliveriesCount || 0;
                    const maxCap = agent.maxCapacity || 5;
                    const loadRatio = activeCount / maxCap;
                    const isToggling = isTogglingId === agent.id;

                    return (
                      <tr key={agent.id} className="hover:bg-container-low/50 transition-colors">
                        {/* Courier Info */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-display font-bold text-xs">
                              {agent.fullName?.slice(0, 2).toUpperCase() || 'AG'}
                            </div>
                            <div>
                              <div className="font-display font-bold text-sm text-ink">
                                {agent.fullName}
                              </div>
                              <div className="text-[11px] text-ink-variant/70">
                                {agent.email} · {agent.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-container-low hairline text-ink text-xs font-medium">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span>{agent.assignedZone?.name || 'Unassigned Zone'}</span>
                          </div>
                        </td>

                        {/* Load Meter */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5 max-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-ink-variant">Load:</span>
                              <span className="font-bold text-ink tabular">
                                {activeCount} / {maxCap}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-container-high rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  loadRatio >= 1
                                    ? 'bg-danger'
                                    : loadRatio > 0.6
                                    ? 'bg-warning'
                                    : 'bg-primary'
                                }`}
                                style={{ width: `${Math.min(100, Math.round(loadRatio * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Availability Toggle Switch Badge */}
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(agent)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full hairline transition-all cursor-pointer shadow-xs ${
                              agent.isAvailable
                                ? 'bg-success-soft border-success/40 text-success hover:bg-success-soft/80'
                                : 'bg-container-high border-hairline text-ink-variant hover:bg-container-high/70'
                            }`}
                            title={
                              agent.isAvailable
                                ? 'Click to set courier Off-Duty'
                                : 'Click to set courier Available'
                            }
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                agent.isAvailable ? 'bg-success animate-pulse' : 'bg-ink-variant/50'
                              }`}
                            />
                            <span className="text-xs font-bold">
                              {agent.isAvailable ? 'Available' : 'Off-Duty'}
                            </span>
                            <Power className="w-3 h-3 ml-0.5 opacity-60" />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                          <Button
                            variant={agent.isAvailable ? 'secondary' : 'primary'}
                            size="sm"
                            isLoading={isToggling}
                            onClick={() => handleToggleAvailability(agent)}
                            title={
                              agent.isAvailable
                                ? 'Set this courier Off-Duty'
                                : 'Make this courier Available for dispatches'
                            }
                          >
                            {agent.isAvailable ? 'Set Off-Duty' : 'Set Available'}
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingAgent(agent)}
                            leftIcon={<Edit2 className="w-3 h-3" />}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Agent Modal */}
        <CreateAgentModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={refetch}
        />

        {/* Edit Agent Modal */}
        {editingAgent && (
          <EditAgentModal
            isOpen={Boolean(editingAgent)}
            agent={editingAgent}
            onClose={() => setEditingAgent(null)}
            onSuccess={refetch}
          />
        )}
      </div>
    </div>
  );
}
