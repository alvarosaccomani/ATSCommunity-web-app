import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

import { SessionService } from '../../core/services/session.service';
import { UnitsService } from '../../core/services/units.service';
import { ClaimsService } from '../../core/services/claims.service';
import { FeesService } from '../../core/services/fees.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { UserUnitsService } from '../../core/services/user-units.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzSkeletonModule,
    NzIconModule,
    NzBadgeModule,
    NzButtonModule,
    NzTableModule,
    NzGridModule,
    NzToolTipModule,
    NzMessageModule
  ],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent implements OnInit {
  isLoading = true;
  cmpUuid = '';
  usrUuid = '';
  userName = '';
  companyName = '';

  // Admin KPIs & Data
  adminStats = {
    totalUnits: 0,
    activeClaims: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    collectionRate: 0,
    totalIssuedAmount: 0,
    totalPaidAmount: 0
  };
  recentClaims: any[] = [];
  pendingTransactions: any[] = [];

  // Resident KPIs & Data
  residentStats = {
    totalPendingBalance: 0,
    totalClaims: 0,
    activeClaims: 0,
    completedClaims: 0,
    claimsProgress: 0,
    assignedUnitsCount: 0
  };
  residentPayments: any[] = [];

  constructor(
    private sessionService: SessionService,
    private unitsService: UnitsService,
    private claimsService: ClaimsService,
    private feesService: FeesService,
    private transactionsService: TransactionsService,
    private userUnitsService: UserUnitsService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  public get isAdmin(): boolean {
    const activeCompany = this.sessionService.getCompany();
    if (!activeCompany || !activeCompany.roles) return false;
    return activeCompany.roles.some((r: any) =>
      r.rol_name === 'Administrador' ||
      r.rol_name === 'Admin' ||
      r.rol_name === 'Administración'
    );
  }

  public loadDashboardData(): void {
    this.isLoading = true;
    const session = this.sessionService.getCurrentSession();
    const activeCompany = this.sessionService.getCompany();

    this.usrUuid = session?.identity?.usr_uuid || '';
    this.userName = session?.identity?.usr_name || 'Usuario';
    this.cmpUuid = activeCompany?.cmp_uuid || '';
    this.companyName = activeCompany?.cmp_name || 'Mi Comunidad';

    if (!this.cmpUuid) {
      this.isLoading = false;
      return;
    }

    if (this.isAdmin) {
      this.loadAdminDashboard();
    } else {
      this.loadResidentDashboard();
    }
  }

  private loadAdminDashboard(): void {
    forkJoin({
      units: this.unitsService.getUnits(this.cmpUuid),
      claims: this.claimsService.getClaims(this.cmpUuid),
      pendingTransactions: this.transactionsService.getTransactions(this.cmpUuid, { tra_status: 'Pending' }),
      allFees: this.feesService.getFees(this.cmpUuid)
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        // 1. Unidades Activas
        const unitsList = res.units?.success ? res.units.data || [] : [];
        this.adminStats.totalUnits = unitsList.length;

        // 2. Reclamos Activos (no finalizados ni rechazados)
        const claimsList = res.claims?.success ? res.claims.data || [] : [];
        this.recentClaims = claimsList
          .slice()
          .sort((a: any, b: any) => new Date(b.cla_createdat).getTime() - new Date(a.cla_createdat).getTime())
          .slice(0, 5);

        this.adminStats.activeClaims = claimsList.filter((c: any) =>
          c.cla_status !== 'FinalizadoAprobado' && c.cla_status !== 'Rechazado'
        ).length;

        // 3. Pagos Pendientes de Auditoría
        const pendingTraList = res.pendingTransactions?.success ? res.pendingTransactions.data || [] : [];
        this.pendingTransactions = pendingTraList
          .slice()
          .sort((a: any, b: any) => new Date(b.tra_createdat).getTime() - new Date(a.tra_createdat).getTime())
          .slice(0, 5);
        this.adminStats.pendingPayments = pendingTraList.length;

        // 4. Recaudación y Tasa de Recaudación
        const feesList = res.allFees?.success ? res.allFees.data || [] : [];
        let totalIssued = 0;
        let totalPaid = 0;

        feesList.forEach((fee: any) => {
          const amt = Number(fee.fee_amount || 0);
          totalIssued += amt;
          if (fee.fee_status === 'Pagada') {
            totalPaid += amt;
          }
        });

        this.adminStats.totalIssuedAmount = totalIssued;
        this.adminStats.totalPaidAmount = totalPaid;
        this.adminStats.monthlyRevenue = totalPaid;
        this.adminStats.collectionRate = totalIssued > 0 ? Math.round((totalPaid / totalIssued) * 100) : 0;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar dashboard de administrador:', err);
        this.message.error('No se pudieron cargar los indicadores de administración.');
      }
    });
  }

  private loadResidentDashboard(): void {
    forkJoin({
      fees: this.feesService.getFees(this.cmpUuid, { usr_uuid: this.usrUuid }),
      claims: this.claimsService.getClaims(this.cmpUuid, { usr_uuid: this.usrUuid }),
      userUnits: this.userUnitsService.getUserUnits(this.cmpUuid, this.usrUuid),
      payments: this.transactionsService.getTransactions(this.cmpUuid, { usr_uuid: this.usrUuid })
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        // 1. Saldo Pendiente
        const feesList = res.fees?.success ? res.fees.data || [] : [];
        let pendingBal = 0;
        feesList.forEach((fee: any) => {
          if (fee.fee_status === 'Pendiente' || fee.fee_status === 'Vencida') {
            pendingBal += Number(fee.fee_amount || 0);
          }
        });
        this.residentStats.totalPendingBalance = pendingBal;

        // 2. Progreso de Reclamos
        const claimsList = res.claims?.success ? res.claims.data || [] : [];
        this.residentStats.totalClaims = claimsList.length;
        this.residentStats.completedClaims = claimsList.filter((c: any) => c.cla_status === 'FinalizadoAprobado').length;
        this.residentStats.activeClaims = claimsList.filter((c: any) =>
          c.cla_status !== 'FinalizadoAprobado' && c.cla_status !== 'Rechazado'
        ).length;
        this.residentStats.claimsProgress = this.residentStats.totalClaims > 0
          ? Math.round((this.residentStats.completedClaims / this.residentStats.totalClaims) * 100)
          : 0;

        // 3. Unidades Asignadas
        const assignedUnits = res.userUnits?.success ? res.userUnits.data || [] : [];
        this.residentStats.assignedUnitsCount = assignedUnits.length;

        // 4. Historial de Pagos Recientes
        const paymentsList = res.payments?.success ? res.payments.data || [] : [];
        this.residentPayments = paymentsList
          .slice()
          .sort((a: any, b: any) => new Date(b.tra_createdat).getTime() - new Date(a.tra_createdat).getTime())
          .slice(0, 5);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar dashboard de residente:', err);
        this.message.error('No se pudieron cargar tus datos de residente.');
      }
    });
  }

  // Métodos Utilitarios para UI
  public formatStatus(status: string): string {
    switch (status) {
      case 'Abierto': return 'Abierto';
      case 'En Licitacion': return 'En Licitación';
      case 'Aprobado': return 'Aprobado';
      case 'En Obra': return 'En Obra';
      case 'FinalizadoAprobado': return 'Finalizado';
      case 'Rechazado': return 'Rechazado';
      case 'Approved': return 'Aprobado';
      case 'Pending': return 'Pendiente';
      case 'Rejected': return 'Rechazado';
      case 'Pendiente': return 'Pendiente';
      case 'Pagada': return 'Pagada';
      case 'Vencida': return 'Vencida';
      default: return status || 'Desconocido';
    }
  }

  public getBadgeStatus(status: string): string {
    switch (status) {
      case 'Abierto':
      case 'Pendiente':
      case 'Pending':
        return 'warning';
      case 'Approved':
      case 'Pagada':
      case 'FinalizadoAprobado':
        return 'success';
      case 'Rechazado':
      case 'Rejected':
      case 'Vencida':
        return 'error';
      case 'En Licitacion':
      case 'Aprobado':
      case 'En Obra':
        return 'processing';
      default:
        return 'default';
    }
  }

  public getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Alta': return '#ff4d4f';
      case 'Media': return '#faad14';
      case 'Baja': return '#52c41a';
      default: return '#1890ff';
    }
  }
}
