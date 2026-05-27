import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { AdminUserResponse } from '@ubax-workspace/shared-api-types';
import type { VisitRequest } from '@ubax-workspace/ubax-web-data-access';

export type AgentOption = Pick<AdminUserResponse, 'userId' | 'firstName' | 'lastName' | 'email'>;

@Component({
  selector: 'ubax-visit-assign-agent-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-assign-agent-dialog.component.html',
  styleUrl: './visit-assign-agent-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onDismiss()' },
})
export class VisitAssignAgentDialogComponent implements OnInit, OnDestroy {
  private readonly doc = inject(DOCUMENT);

  readonly visit = input.required<VisitRequest>();
  readonly agents = input<AgentOption[]>([]);
  readonly loading = input<boolean>(false);

  readonly agentAssigned = output<{ agentId: string }>();
  readonly dismissed = output<void>();

  readonly selectedAgentId = signal('');

  ngOnInit(): void {
    this.doc.body.classList.add('ubax-overlay-open');
    const currentAgentId = this.visit().agentId;
    if (currentAgentId) this.selectedAgentId.set(currentAgentId);
  }

  ngOnDestroy(): void {
    this.doc.body.classList.remove('ubax-overlay-open');
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.onDismiss();
  }

  onDismiss(): void {
    this.dismissed.emit();
  }

  onSubmit(): void {
    if (!this.selectedAgentId()) return;
    this.agentAssigned.emit({ agentId: this.selectedAgentId() });
  }

  agentLabel(agent: AgentOption): string {
    const name = [agent.firstName, agent.lastName].filter(Boolean).join(' ');
    return name || agent.email || agent.userId || '—';
  }

  get isValid(): boolean {
    return !!this.selectedAgentId();
  }
}
