export type ShareLinkInput = {
  title: string;
  text?: string;
  url: string;
};

export type ShareLinkResult = 'shared' | 'copied' | 'cancelled';

export const shareLink = async (input: ShareLinkInput): Promise<ShareLinkResult> => {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: input.title,
        text: input.text,
        url: input.url,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled';
      }

      throw error;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(input.url);
    return 'copied';
  }

  throw new Error('Sharing is not supported on this device.');
};
