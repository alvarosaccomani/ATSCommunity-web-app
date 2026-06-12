import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionsService } from '../../core/services/transactions.service';
import { SessionService } from '../../core/services/session.service';
import { TransactionInterface } from '../../core/interfaces/transaction/transaction.interface';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-my-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzSelectModule,
    NzBadgeModule,
    NzMessageModule
  ],
  templateUrl: './my-transactions.component.html',
  styleUrl: './my-transactions.component.scss'
})
export class MyTransactionsComponent implements OnInit {
  transactions: TransactionInterface[] = [];
  isLoading = false;
  cmpUuid = '';
  usrUuid = '';

  // Filtros
  statusFilter = '';

  // Tarjetas Resumen
  totalPaidAmount = 0;
  successfulCount = 0;

  // Modal Detalle Comprobante
  isDetailVisible = false;
  selectedTransaction: TransactionInterface | null = null;

  constructor(
    private transactionsService: TransactionsService,
    private sessionService: SessionService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;

    if (this.usrUuid) {
      this.loadMyTransactions();
    } else {
      this.message.warning('No se pudo identificar tu usuario en la sesión.');
    }
  }

  public loadMyTransactions(): void {
    this.isLoading = true;
    const filters: any = {
      usr_uuid: this.usrUuid
    };
    if (this.statusFilter) filters.tra_status = this.statusFilter;

    this.transactionsService.getTransactions(this.cmpUuid, filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.transactions = res.data || [];
          this.calculateSummary();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar tus comprobantes de pago.');
      }
    });
  }

  public calculateSummary(): void {
    let total = 0;
    let success = 0;

    this.transactions.forEach(tra => {
      if (tra.tra_status === 'Approved') {
        total += Number(tra.tra_totalamount || 0);
        success++;
      }
    });

    this.totalPaidAmount = total;
    this.successfulCount = success;
  }

  public applyFilters(): void {
    this.loadMyTransactions();
  }

  public clearFilters(): void {
    this.statusFilter = '';
    this.loadMyTransactions();
  }

  public showDetailModal(tra: TransactionInterface): void {
    this.selectedTransaction = tra;
    this.isDetailVisible = true;
  }

  public closeDetailModal(): void {
    this.isDetailVisible = false;
    this.selectedTransaction = null;
  }

  public printReceipt(): void {
    window.print();
  }

  public getBadgeStatus(status: string): 'success' | 'error' | 'warning' | 'processing' | 'default' {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'processing';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  }

  public formatStatus(status: string): string {
    switch (status) {
      case 'Approved':
        return 'Aprobado';
      case 'Pending':
        return 'Pendiente';
      case 'Rejected':
        return 'Rechazado';
      default:
        return status;
    }
  }
}
