import { env } from "../config/env.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

function formatFullAddress(property) {
  return [
    property.addressLine1 || property.address,
    property.addressLine2,
    property.city,
    property.state,
    property.postalCode
  ]
    .filter(Boolean)
    .join(", ");
}

export function serializeDashboard({ properties, tenants, leases, documents }) {
  const units = properties.flatMap((property) => property.units);
  const occupiedUnits = units.filter((unit) => unit.status === "occupied").length;
  const vacantUnits = units.filter((unit) => unit.status === "vacant").length;
  const activeLeases = leases.filter((lease) => lease.status === "active").length;
  const expiringLeases = leases.filter((lease) => {
    const daysUntilEnd = Math.ceil((new Date(lease.endDate) - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd >= 0 && daysUntilEnd <= 60;
  }).length;
  const scheduledRent = leases
    .filter((lease) => lease.status === "active")
    .reduce((sum, lease) => sum + lease.monthlyRent, 0);

  return {
    storage: {
      provider: env.storageProvider,
      googleReady: env.storageProvider === "gcs"
    },
    metrics: {
      propertyCount: properties.length,
      totalUnits: units.length,
      occupiedUnits,
      vacantUnits,
      activeLeases,
      expiringLeases,
      tenantCount: tenants.length,
      documentCount: documents.length,
      scheduledRent,
      scheduledRentFormatted: formatCurrency(scheduledRent)
    },
    properties: properties.map((property) => ({
      id: property.id,
      code: property.code,
      name: property.name,
      address: formatFullAddress(property),
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
      country: property.country,
      propertyType: property.propertyType,
      ownershipName: property.ownershipName,
      notes: property.notes,
      activeLeaseCount: property.leases.filter((lease) => lease.status === "active").length,
      units: property.units.map((unit) => ({
        id: unit.id,
        label: unit.label,
        floor: unit.floor,
        status: unit.status,
        beds: unit.beds,
        baths: unit.baths,
        squareFeet: unit.squareFeet,
        rent: unit.rent,
        rentFormatted: formatCurrency(unit.rent),
        availableFrom: unit.availableFrom ? formatDate(unit.availableFrom) : "Now",
        tenantName: unit.tenant?.name || null
      }))
    })),
    tenants: tenants.map((tenant) => ({
      id: tenant.id,
      propertyId: tenant.propertyId,
      unitId: tenant.unitId,
      name: tenant.name,
      preferredName: tenant.preferredName,
      email: tenant.email,
      phone: tenant.phone,
      alternatePhone: tenant.alternatePhone,
      governmentIdType: tenant.governmentIdType,
      governmentIdNumber: tenant.governmentIdNumber,
      policeVerificationStatus: tenant.policeVerificationStatus,
      propertyName: tenant.property.name,
      unitLabel: tenant.unit.label,
      leaseEndLabel: tenant.leaseEnd ? formatDate(tenant.leaseEnd) : "TBD",
      documentCount: tenant.documents.length
    })),
    leases: leases.map((lease) => ({
      id: lease.id,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      tenantId: lease.tenantId,
      status: lease.status,
      tenantName: lease.tenant.name,
      propertyName: lease.property.name,
      unitLabel: lease.unit.label,
      startDateLabel: formatDate(lease.startDate),
      endDateLabel: formatDate(lease.endDate),
      rentDueDay: lease.rentDueDay,
      monthlyRentFormatted: formatCurrency(lease.monthlyRent),
      documentCount: lease.documents.length
    })),
    documents: documents.slice(0, 8).map((document) => ({
      id: document.id,
      title: document.title,
      documentType: document.documentType,
      fileName: document.fileName,
      uploadedAtLabel: formatDate(document.createdAt),
      entityLabel: document.tenant
        ? document.tenant.name
        : `${document.lease?.tenant?.name || "Lease"} | ${document.lease?.property?.name || ""}`.trim(),
      downloadPath: `/documents/${document.id}/download`
    }))
  };
}
