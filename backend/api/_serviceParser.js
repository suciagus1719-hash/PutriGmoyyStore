function getServiceId(service) {
  return (
    service?.service ??
    service?.id ??
    service?.sid ??
    service?.ID ??
    service?.ID_SERVICE ??
    null
  );
}

function getServiceCategory(service) {
  return service?.category || service?.Category || "";
}

function getServicePrice(service) {
  return Number(
    service?.rate ??
      service?.price ??
      service?.cost ??
      service?.Price ??
      service?.Rate ??
      0
  );
}

function getServiceDescription(service) {
  return (
    service?.description ??
    service?.desc ??
    service?.note ??
    service?.Note ??
    ""
  );
}

function getServiceName(service) {
  return service?.name || service?.service_name || `Service ${getServiceId(service) || ""}`;
}

function getServiceMin(service) {
  return Number(service?.min ?? service?.minimum ?? 0);
}

function getServiceMax(service) {
  return Number(service?.max ?? service?.maximum ?? 0);
}

module.exports = {
  getServiceId,
  getServiceCategory,
  getServicePrice,
  getServiceDescription,
  getServiceName,
  getServiceMin,
  getServiceMax,
};
