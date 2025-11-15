// Utility functions for badge colors and variants

export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'RESOLVED':
    case 'CLOSED':
      return 'default';
    case 'PENDING':
    case 'OPEN':
    case 'IN_PROGRESS':
      return 'secondary';
    case 'REJECTED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getRoleBadgeColor = (role: string): string => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'bg-destructive/20 text-destructive';
    case 'SPOC':
      return 'bg-primary/20 text-primary';
    case 'TEACHER':
      return 'bg-accent/20 text-accent';
    case 'STUDENT':
      return 'bg-secondary/20 text-secondary';
    default:
      return 'bg-muted/20 text-muted-foreground';
  }
};
