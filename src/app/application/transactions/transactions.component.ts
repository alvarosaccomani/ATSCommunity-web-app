import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionsService } from '../../core/services/transactions.service';
import { SessionService } from '../../core/services/session.service';
import { UnitsService } from '../../core/services/units.service';
import { FeesService } from '../../core/services/fees.service';
import { TransactionInterface } from '../../core/interfaces/transaction/transaction.interface';
import { UnitInterface } from '../../core/interfaces/unit';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-transactions',
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
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  transactions: TransactionInterface[] = [];
  units: UnitInterface[] = [];
  isLoading = false;
  isActionLoading = false;
  cmpUuid = '';

  // Filtros
  statusFilter = '';
  unitFilter = '';

  // Modal Detalle
  isDetailVisible = false;
  selectedTransaction: TransactionInterface | null = null;

  constructor(
    private transactionsService: TransactionsService,
    private sessionService: SessionService,
    private unitsService: UnitsService,
    private feesService: FeesService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;
    this.loadTransactions();
    this.loadUnits();
  }

  public loadTransactions(): void {
    this.isLoading = true;
    const filters: any = {};
    if (this.statusFilter) filters.tra_status = this.statusFilter;
    if (this.unitFilter) filters.uni_uuid = this.unitFilter;

    this.transactionsService.getTransactions(this.cmpUuid, filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.transactions = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar las transacciones.');
      }
    });
  }

  public loadUnits(): void {
    this.unitsService.getUnits(this.cmpUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.units = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public applyFilters(): void {
    this.loadTransactions();
  }

  public clearFilters(): void {
    this.statusFilter = '';
    this.unitFilter = '';
    this.loadTransactions();
  }

  public showDetailModal(tra: TransactionInterface): void {
    this.selectedTransaction = tra;
    this.isDetailVisible = true;
  }

  public closeDetailModal(): void {
    this.isDetailVisible = false;
    this.selectedTransaction = null;
  }

  public approveTransaction(tra: TransactionInterface): void {
    const { cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, tra_uuid } = tra;
    if (!cmp_uuid || !usr_uuid || !uni_uuid || !usruni_uuid || !fee_uuid || !tra_uuid) return;

    this.isActionLoading = true;
    const updatePayload = {
      tra_gatewayid: tra.tra_gatewayid,
      tra_totalamount: tra.tra_totalamount,
      tra_platformfee: tra.tra_platformfee || 0,
      tra_recipientamount: tra.tra_recipientamount,
      tra_status: 'Approved'
    };

    this.transactionsService.updateTransaction(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, tra_uuid, updatePayload).subscribe({
      next: () => {
        const feePayload = {
          fee_period: tra.fee?.fee_period,
          fee_amount: tra.fee?.fee_amount,
          fee_status: 'Pagada'
        };

        this.feesService.updateFee(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, feePayload).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.message.success('El pago ha sido aprobado y la expensa fue marcada como Pagada.');
            this.closeDetailModal();
            this.loadTransactions();
          },
          error: (err: any) => {
            this.isActionLoading = false;
            console.error(err);
            this.message.warning('La transacción fue aprobada, pero falló la actualización del estado de la expensa.');
            this.closeDetailModal();
            this.loadTransactions();
          }
        });
      },
      error: (err: any) => {
        this.isActionLoading = false;
        console.error(err);
        this.message.error(err.error?.error || 'Error al aprobar la transacción.');
      }
    });
  }

  public rejectTransaction(tra: TransactionInterface): void {
    const { cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, tra_uuid } = tra;
    if (!cmp_uuid || !usr_uuid || !uni_uuid || !usruni_uuid || !fee_uuid || !tra_uuid) return;

    this.isActionLoading = true;
    const updatePayload = {
      tra_gatewayid: tra.tra_gatewayid,
      tra_totalamount: tra.tra_totalamount,
      tra_platformfee: tra.tra_platformfee || 0,
      tra_recipientamount: tra.tra_recipientamount,
      tra_status: 'Rejected'
    };

    this.transactionsService.updateTransaction(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, tra_uuid, updatePayload).subscribe({
      next: () => {
        const feePayload = {
          fee_period: tra.fee?.fee_period,
          fee_amount: tra.fee?.fee_amount,
          fee_status: 'Pendiente'
        };

        this.feesService.updateFee(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, feePayload).subscribe({
          next: () => {
            this.isActionLoading = false;
            this.message.warning('El pago ha sido rechazado. La expensa permanece Pendiente de pago.');
            this.closeDetailModal();
            this.loadTransactions();
          },
          error: (err: any) => {
            this.isActionLoading = false;
            console.error(err);
            this.message.warning('La transacción fue rechazada, pero falló la actualización del estado de la expensa.');
            this.closeDetailModal();
            this.loadTransactions();
          }
        });
      },
      error: (err: any) => {
        this.isActionLoading = false;
        console.error(err);
        this.message.error(err.error?.error || 'Error al rechazar la transacción.');
      }
    });
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
        return 'Aprobada';
      case 'Pending':
        return 'Pendiente';
      case 'Rejected':
        return 'Rechazada';
      default:
        return status;
    }
  }
}
