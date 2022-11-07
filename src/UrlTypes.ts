/** ArcGIS REST URL ending in "/arcgis/rest" */
export type ArcGisRestRootUrl = `https://${string}/arcgis/rest`;

/** ArcGIS REST services URL ending in "arcgis/rest/services" */
export type ArcGisRestServicesUrl = `${ArcGisRestRootUrl}/services`;

/** The names of service types that can have numbered layers. */
export type HasLayersServiceTypeName = "Map" | "Feature";

/** Service type names. {@link HasLayersServiceTypeName} + "GP" */
export type ServiceTypeName = HasLayersServiceTypeName | "GP";

/** Service type. {@link ServiceTypeName} + "Server" */
export type ServiceType = `${ServiceTypeName}Server`;

/** An ArcGIS Server folder URL */
export type FolderUrl = `${ArcGisRestServicesUrl}/${string}`;

/**
 * The URL of either a {@link ArcGisRestServicesUrl} or {@link FolderUrl},
 * which can contain services.
 */
export type ServiceParent = ArcGisRestServicesUrl | FolderUrl;

/**
 * The URL of an ArcGIS Service.
 */
export type ServiceUrl<T extends ServiceType> = `${ServiceParent}/${T}`;

/**The URL of an ArcGIS Service Layer */
export type LayerUrl = `${ServiceUrl<"FeatureServer" | "MapServer">}/${number}`;

/**
 * The URL of an ArcGIS Geoprocessing service tool.
 */
export type GPToolUrl = `${ServiceUrl<"GPServer">}/${string}`;
