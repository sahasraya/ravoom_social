import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class CurtomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Return true if this route should be reused (based on custom logic, e.g. route data)
    return route.data && route.data['reuseRoute'] ? true : false;
  }

  store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
    // Store the detached route in a map for later reuse
    if (route.data && route.data['reuseRoute']) {
      this.storedRoutes.set(route.routeConfig?.path!, detachedTree);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // Only attach the stored route if it's present in the map
    return !!route.data && !!this.storedRoutes.get(route.routeConfig?.path!);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    // Retrieve the stored route if it exists
    if (route.data && route.data['reuseRoute']) {
      return this.storedRoutes.get(route.routeConfig?.path!) || null;
    }
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Prevent re-initialization if the future and current routes are the same
    return future.routeConfig === curr.routeConfig;
  }
}