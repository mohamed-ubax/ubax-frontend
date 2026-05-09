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

  it('affiche un toast success avec style et animation renforces', () => {
    service.success('Opération réussie');

    expect(messageService.add).toHaveBeenCalledOnce();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'success',
      summary: 'Operation reussie',
      detail: 'Opération réussie',
      life: 4200,
      closable: true,
      styleClass: 'ubax-toast-message ubax-toast-message--success',
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
  });

  it('affiche un toast error avec style et animation renforces', () => {
    service.error('Une erreur est survenue');

    expect(messageService.add).toHaveBeenCalledOnce();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Action impossible',
      detail: 'Une erreur est survenue',
      life: 6200,
      closable: true,
      styleClass: 'ubax-toast-message ubax-toast-message--error',
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
  });

  it('affiche un toast info avec style et animation renforces', () => {
    service.info('Traitement en cours');

    expect(messageService.add).toHaveBeenCalledOnce();
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Information',
      detail: 'Traitement en cours',
      life: 4200,
      closable: true,
      styleClass: 'ubax-toast-message ubax-toast-message--info',
      contentStyleClass: 'ubax-toast-content',
      closeIcon: 'pi-times',
    });
  });

  it('peut afficher plusieurs toasts successifs', () => {
    service.success('Créé');
    service.error('Suppression impossible');
    service.info('Chargement…');

    expect(messageService.add).toHaveBeenCalledTimes(3);
  });
});
