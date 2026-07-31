import { Badge } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import type { ViewerInfo } from '../../utils/demandViewers';

interface ViewedBadgeProps {
  demandId: string;
  viewers?: ViewerInfo[];
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Simplified ViewedBadge — our backend has no "viewed" concept,
 * so this just shows a static "Lido" badge without API calls.
 */
export function ViewedBadge({
  label = 'Lido',
  size = 'xs',
}: ViewedBadgeProps) {
  return (
    <Badge
      color="teal"
      size={size}
      variant="light"
      leftSection={<IconEye size={10} />}
      style={{ cursor: 'default' }}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
    </Badge>
  );
}
