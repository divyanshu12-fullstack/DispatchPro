import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { adminApi } from '../../api/admin.api.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Save } from 'lucide-react';

export function EditAgentModal({ isOpen, onClose, agent, onSuccess }) {
  const [assignedZoneId, setAssignedZoneId] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('5');
  const [isAvailable, setIsAvailable] = useState(true);
  const [zones, setZones] = useState([]);
  const [isZonesLoading, setIsZonesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();

  useEffect(() => {
    if (agent && isOpen) {
      setAssignedZoneId(agent.assignedZone?.id || agent.assignedZoneId || '');
      setMaxCapacity(String(agent.maxCapacity || 5));
      setIsAvailable(Boolean(agent.isAvailable));
      setError('');

      setIsZonesLoading(true);
      adminApi
        .listZones()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.items || [];
          setZones(list);
        })
        .catch(() => {
          toast.error('Failed to load active delivery zones.');
        })
        .finally(() => {
          setIsZonesLoading(false);
        });
    }
  }, [agent, isOpen]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const capNum = parseInt(maxCapacity, 10);
    if (!capNum || capNum < (agent?.currentActiveDeliveriesCount || 1)) {
      setError(
        `Capacity cannot be lower than current active workload (${agent?.currentActiveDeliveriesCount || 0} parcels).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.updateAgent(agent.id, {
        assignedZoneId: assignedZoneId || undefined,
        maxCapacity: capNum,
        isAvailable,
      });

      toast.success(`Agent ${agent.fullName} updated successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update agent details.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!agent) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Courier: ${agent.fullName}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Readonly identity */}
        <div className="p-3 bg-container-low hairline rounded-lg text-xs space-y-1">
          <div className="font-semibold text-ink">{agent.fullName}</div>
          <div className="text-ink-variant/70">{agent.email} · {agent.phone}</div>
          <div className="text-[11px] text-ink-variant">
            Active Load: <strong className="text-ink">{agent.currentActiveDeliveriesCount || 0}</strong> / {agent.maxCapacity} parcels
          </div>
        </div>

        {/* Assigned Zone Selector */}
        <Select
          label="Assigned Delivery Zone"
          value={assignedZoneId}
          onChange={(e) => setAssignedZoneId(e.target.value)}
          options={zones.map((z) => ({ value: z.id, label: `${z.name} (${z.code})` }))}
          disabled={isSubmitting || isZonesLoading}
          required
        />

        {/* Max Capacity */}
        <Input
          label="Max Concurrent Capacity"
          type="number"
          min={agent.currentActiveDeliveriesCount || 1}
          max="20"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          helperText={`Must be ≥ current active load (${agent.currentActiveDeliveriesCount || 0})`}
          disabled={isSubmitting}
          required
        />

        {/* Availability Radio Cards */}
        <div className="space-y-2">
          <label className="block label-caps text-ink-variant">Courier Duty Status</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              onClick={() => !isSubmitting && setIsAvailable(true)}
              className={`p-3 rounded-lg hairline cursor-pointer transition-all flex items-start gap-2.5 ${
                isAvailable
                  ? 'bg-success-soft/60 border-success/40 ring-1 ring-success shadow-xs'
                  : 'bg-container-low hover:bg-container'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  isAvailable ? 'border-success bg-success text-on-primary' : 'border-outline bg-container-lowest'
                }`}
              >
                {isAvailable && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <div className="font-semibold text-xs text-ink flex items-center gap-1.5">
                  <span>Available</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                </div>
                <div className="text-[11px] text-ink-variant mt-0.5">Active for dispatches</div>
              </div>
            </div>

            <div
              onClick={() => !isSubmitting && setIsAvailable(false)}
              className={`p-3 rounded-lg hairline cursor-pointer transition-all flex items-start gap-2.5 ${
                !isAvailable
                  ? 'bg-container-lowest border-primary ring-1 ring-primary shadow-xs'
                  : 'bg-container-low hover:bg-container'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                  !isAvailable ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-container-lowest'
                }`}
              >
                {!isAvailable && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <div className="font-semibold text-xs text-ink">Off-Duty</div>
                <div className="text-[11px] text-ink-variant mt-0.5">Paused from queue</div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
