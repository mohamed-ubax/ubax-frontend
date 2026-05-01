import '@angular/compiler';
import { Injector } from '@angular/core';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let messageService: { add: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    messageService = { add: vi.fn() };

    const injector = Injector.create({
      providers: [
        { provide: MessageService, useValue: messageService },
        NotificationService,
      ],
    });

    service = injector.get(NotificationService);
  });

  it('affiche un toast success avec life 4000', () => {
    service.success('Opération réussie');

    expect(messageService.add).toHaveBeenCalledOnce();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      detail: 'Opération réussie',
      life: 4000,
    });
  });

  it('affiche un toast error avec life 6000', () => {
    service.error('Une erreur est survenue');

    expect(messageService.add).toHaveBeenCalledOnce();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      detail: 'Une erreur est survenue',
      life: 6000,
    });
  });

  it('affiche un toast info avec life 4000', () => {
    service.info('Traitement en cours');

    expect(messageService.add).toHaveBeenCalledOnce();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'info',
      detail: 'Traitement en cours',
      life: 4000,
    });
  });

  it('peut afficher plusieurs toasts successifs', () => {
    service.success('Créé');
    service.error('Suppression impossible');
    service.info('Chargement…');

    expect(messageService.add).toHaveBeenCalledTimes(3);
  });
});
