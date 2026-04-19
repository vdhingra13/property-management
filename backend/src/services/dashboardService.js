import { formatCurrency, formatDate } from "../utils/formatters.js";

export function serializeDashboard(properties) {
  const flattenedUnits = properties.flatMap((property) => property.units);
  const flattenedPayments = properties.flatMap((property) =>
    property.units.flatMap((unit) =>
      (unit.tenant?.payments || []).map((payment) => ({
        ...payment,
        tenantName: unit.tenant?.name || "Unknown tenant",
        propertyName: property.name
      }))
    )
  );
  const maintenance = properties.flatMap((property) => property.maintenance);

  const occupiedUnits = flattenedUnits.filter((unit) => unit.status === "occupied").length;
  const vacantUnits = flattenedUnits.filter((unit) => unit.status === "vacant").length;
  const noticeUnits = flattenedUnits.filter((unit) => unit.status === "notice").length;
  const scheduledRent = flattenedUnits
    .filter((unit) => unit.status !== "vacant")
    .reduce((sum, unit) => sum + unit.rent, 0);
  const collectedRent = flattenedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRevenue = flattenedUnits.reduce((sum, unit) => sum + unit.rent, 0);

  return {
    metrics: {
      propertyCount: properties.length,
      totalUnits: flattenedUnits.length,
      occupiedUnits,
      vacantUnits,
      noticeUnits,
      vacancyRisk: vacantUnits + noticeUnits,
      occupancyRate: flattenedUnits.length
        ? Math.round((occupiedUnits / flattenedUnits.length) * 100)
        : 0,
      collectionRate: scheduledRent ? Math.round((collectedRent / scheduledRent) * 100) : 0,
      totalRevenue,
      totalRevenueFormatted: formatCurrency(totalRevenue),
      highPriorityMaintenance: maintenance.filter((request) => request.priority === "high").length
    },
    properties: properties.map((property) => {
      const occupied = property.units.filter((unit) => unit.status === "occupied").length;
      return {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        occupiedUnits: occupied,
        totalUnits: property.units.length,
        occupancyRate: property.units.length ? Math.round((occupied / property.units.length) * 100) : 0,
        openMaintenanceCount: property.maintenance.length,
        monthlyRevenueFormatted: formatCurrency(
          property.units.reduce((sum, unit) => sum + unit.rent, 0)
        ),
        units: property.units.map((unit) => ({
          id: unit.id,
          label: unit.label,
          status: unit.status,
          beds: unit.beds,
          baths: unit.baths,
          rentFormatted: formatCurrency(unit.rent),
          tenant: unit.tenant
            ? {
                id: unit.tenant.id,
                name: unit.tenant.name,
                leaseEndLabel: `Lease ends ${formatDate(unit.tenant.leaseEnd)}`
              }
            : null
        }))
      };
    }),
    payments: flattenedPayments
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
      .slice(0, 6)
      .map((payment) => ({
        id: payment.id,
        status: payment.status,
        amountFormatted: formatCurrency(payment.amount),
        dueDateLabel: formatDate(payment.dueDate),
        tenantName: payment.tenantName,
        propertyName: payment.propertyName
      })),
    maintenance: maintenance.slice(0, 6).map((request) => ({
      id: request.id,
      title: request.title,
      priority: request.priority,
      status: request.status,
      unit: request.unit,
      propertyName: request.property.name
    }))
  };
}
