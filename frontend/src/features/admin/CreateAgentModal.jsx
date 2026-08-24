import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { adminApi } from '../../api/admin.api.js';
import { getErrorMessage } from '../../lib/errors.js';
import { UserPlus } from 'lucide-react';

export function CreateAgentModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    assignedZoneId: '',
    maxCapacity: '5',
  });

  const [zones, setZones] = useState([]);
  const [isZonesLoading, setIsZonesLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsZonesLoading(true);
      adminApi
        .listZones()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.items || [];
          setZones(list);
          if (list.length > 0 && !formData.assignedZoneId) {
            setFormData((prev) => ({ ...prev, assignedZoneId: list[0].id }));
          }
        })
        .catch(() => {
          toast.error('Failed to load active delivery zones.');
        })
        .finally(() => {
          setIsZonesLoading(false);
        });
    }
  }, [isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Valid email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!formData.assignedZoneId) errors.assignedZoneId = 'Assigned zone is required';
    if (!formData.maxCapacity || parseInt(formData.maxCapacity, 10) < 1) {
      errors.maxCapacity = 'Capacity must be at least 1';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.createAgent({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        assignedZoneId: formData.assignedZoneId,
        maxCapacity: parseInt(formData.maxCapacity, 10),
      });

      toast.success(`Agent account for ${formData.fullName} created!`);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        assignedZoneId: zones[0]?.id || '',
        maxCapacity: '5',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
      } else {
        toast.error(getErrorMessage(err, 'Failed to create field agent.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Field Courier Agent"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Ramesh Singh"
          value={formData.fullName}
          onChange={(e) => handleFieldChange('fullName', e.target.value)}
          error={fieldErrors.fullName}
          disabled={isSubmitting}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            placeholder="ramesh@courier.com"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            error={fieldErrors.phone}
            numericOnly
            disabled={isSubmitting}
            required
          />
        </div>

        <Input
          label="Login Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={formData.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          error={fieldErrors.password}
          helperText="Agent will use this password to log in to /login"
          disabled={isSubmitting}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Assigned Delivery Zone"
            value={formData.assignedZoneId}
            onChange={(e) => handleFieldChange('assignedZoneId', e.target.value)}
            error={fieldErrors.assignedZoneId}
            options={zones.map((z) => ({ value: z.id, label: `${z.name} (${z.code})` }))}
            disabled={isSubmitting || isZonesLoading}
            required
          />

          <Input
            label="Max Load Capacity"
            type="number"
            min="1"
            max="20"
            value={formData.maxCapacity}
            onChange={(e) => handleFieldChange('maxCapacity', e.target.value)}
            error={fieldErrors.maxCapacity}
            helperText="Concurrent parcel limit"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
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
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Create Agent Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
