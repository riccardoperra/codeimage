import {createSignal, getOwner, onCleanup, onSettled} from 'solid-js';
import {holds} from './decide';
import type {Place, Where} from './registry';

type Reveal = (item: string | undefined) => void | Promise<void>;
type Claim = {reveal: Reveal};

export function createLocationRegistry() {
  const locations = new Map<Place | Where, Set<Claim>>();
  const [version, setVersion] = createSignal(0, {ownedWrite: true});
  const notify = () => {
    setVersion(value => value + 1);
  };

  function bind(place: Place | Where, reveal: Reveal) {
    if (!getOwner()) return;
    const claim = {reveal};
    let disposed = false;
    onCleanup(() => {
      disposed = true;
      const claims = locations.get(place);
      if (!claims?.delete(claim)) return;
      if (!claims.size) locations.delete(place);
      notify();
    });
    onSettled(() => {
      if (disposed) return;
      const claims = locations.get(place) ?? new Set();
      claims.add(claim);
      locations.set(place, claims);
      notify();
    });
  }

  function find(where: Where) {
    version();
    const match = [...locations]
      .filter(([place]) => holds(place, where))
      .sort(([a], [b]) => b.length - a.length)[0];
    if (!match) return;
    const [place, claims] = match;
    const last = [...claims].at(-1);
    if (last) {
      return {
        reveal: last.reveal,
        item: where === place ? undefined : where.slice(place.length + 1),
      };
    }
  }

  return {bind, find};
}
