import { Basebox, LocalStorageSessionStore } from '@moureau/basebox';

export { OAuthCancelledError, PopupBlockedError } from '@moureau/basebox';

const publicKey = import.meta.env.VITE_BASEBOX_PUBLIC_KEY;

export const sessionStore = new LocalStorageSessionStore();

export const basebox =
  publicKey !== undefined && publicKey.startsWith('bb_anon_')
    ? new Basebox({ publicKey, sessionStore })
    : undefined;
