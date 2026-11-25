import { httpClient, type FastApiOptions } from "./http-client";

export const get = (route: string, options?: FastApiOptions) =>
  httpClient.request("GET", route, options);

export const post = (route: string, options?: FastApiOptions) =>
  httpClient.request("POST", route, options);

export const put = (route: string, options?: FastApiOptions) =>
  httpClient.request("PUT", route, options);

export const patch = (route: string, options?: FastApiOptions) =>
  httpClient.request("PATCH", route, options);

const deleteRequest = (route: string, options?: FastApiOptions) =>
  httpClient.request("DELETE", route, options);

export { deleteRequest as delete };
