import { PasswordService } from './password.service';

describe('PasswordService (Argon2id)', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('should generate valid Argon2id hash', async () => {
    const raw = 'P@ssword123!';
    const hash = await service.hash(raw);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isValid = await service.verify(hash, raw);
    expect(isValid).toBe(true);

    const isWrong = await service.verify(hash, 'IncorrectPassword');
    expect(isWrong).toBe(false);
  });
});
