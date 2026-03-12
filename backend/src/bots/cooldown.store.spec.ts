import { cooldownKey, auctionCooldownKey } from './cooldown.store';

describe('cooldown.store', () => {
  describe('cooldownKey', () => {
    it('should return bot:cooldown:{auctionId}:{botId} format', () => {
      expect(cooldownKey('auction-1', 'bot-1')).toBe(
        'bot:cooldown:auction-1:bot-1',
      );
    });

    it('should use different auction and bot ids', () => {
      expect(cooldownKey('auction-abc', 'bot-xyz')).toBe(
        'bot:cooldown:auction-abc:bot-xyz',
      );
    });

    it('should produce different keys for different auctions', () => {
      const key1 = cooldownKey('auction-1', 'bot-1');
      const key2 = cooldownKey('auction-2', 'bot-1');
      expect(key1).not.toBe(key2);
    });

    it('should produce different keys for different bots', () => {
      const key1 = cooldownKey('auction-1', 'bot-1');
      const key2 = cooldownKey('auction-1', 'bot-2');
      expect(key1).not.toBe(key2);
    });
  });

  describe('auctionCooldownKey', () => {
    it('should return bot:auction:{auctionId} format', () => {
      expect(auctionCooldownKey('auction-1')).toBe('bot:auction:auction-1');
    });

    it('should use auction id', () => {
      expect(auctionCooldownKey('auction-xyz')).toBe(
        'bot:auction:auction-xyz',
      );
    });

    it('should produce different keys for different auctions', () => {
      const key1 = auctionCooldownKey('auction-1');
      const key2 = auctionCooldownKey('auction-2');
      expect(key1).not.toBe(key2);
    });

    it('should have different prefix from cooldownKey', () => {
      const cooldown = cooldownKey('a', 'b');
      const auction = auctionCooldownKey('a');
      expect(cooldown.startsWith('bot:cooldown:')).toBe(true);
      expect(auction.startsWith('bot:auction:')).toBe(true);
      expect(cooldown).not.toBe(auction);
    });
  });
});
