import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeesService } from '../../core/services/fees.service';
import { SessionService } from '../../core/services/session.service';
import { UserUnitsService } from '../../core/services/user-units.service';
import { UnitsService } from '../../core/services/units.service';
import { FeeInterface } from '../../core/interfaces/fee/fee.interface';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-my-fees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzBadgeModule,
    NzDatePickerModule,
    NzMessageModule
  ],
  templateUrl: './my-fees.component.html',
  styleUrl: './my-fees.component.scss'
})
export class MyFeesComponent implements OnInit {
  fees: FeeInterface[] = [];
  myUnits: any[] = [];
  isLoading = false;
  cmpUuid = '';
  usrUuid = '';

  // Filtros
  statusFilter = '';
  unitFilter = '';
  periodFilter: Date | null = null;

  // Tarjetas de Resumen
  totalPendingBalance = 0;
  paidCount = 0;
  overdueCount = 0;

  constructor(
    private feesService: FeesService,
    private sessionService: SessionService,
    private userUnitsService: UserUnitsService,
    private unitsService: UnitsService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;

    if (this.usrUuid) {
      this.loadMyUnits();
      this.loadMyFees();
    } else {
      this.message.warning('No se pudo identificar tu usuario en la sesión.');
    }
  }

  public async loadMyUnits(): Promise<void> {
    try {
      const res: any = await lastValueFrom(this.userUnitsService.getUserUnits(this.cmpUuid, this.usrUuid));
      if (res.success && res.data) {
        const mappings = res.data;
        const list = [];
        for (const m of mappings) {
          if (m.uni_uuid) {
            const unitRes: any = await lastValueFrom(this.unitsService.getUnitById(this.cmpUuid, m.uni_uuid));
            if (unitRes.success) {
              list.push(unitRes.data);
            }
          }
        }
        this.myUnits = list;
      }
    } catch (err) {
      console.error('Error al cargar unidades del habitante:', err);
    }
  }

  public loadMyFees(): void {
    this.isLoading = true;
    const filters: any = {
      usr_uuid: this.usrUuid
    };
    if (this.statusFilter) filters.fee_status = this.statusFilter;
    if (this.unitFilter) filters.uni_uuid = this.unitFilter;
    if (this.periodFilter) {
      filters.fee_period = this.formatPeriod(this.periodFilter);
    }

    this.feesService.getFees(this.cmpUuid, filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.fees = res.data || [];
          this.calculateSummary();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar tus expensas.');
      }
    });
  }

  public calculateSummary(): void {
    let pending = 0;
    let paid = 0;
    let overdue = 0;

    this.fees.forEach(fee => {
      if (fee.fee_status === 'Pendiente' || fee.fee_status === 'Vencida') {
        pending += Number(fee.fee_amount || 0);
      }
      if (fee.fee_status === 'Pagada') {
        paid++;
      }
      if (fee.fee_status === 'Vencida') {
        overdue++;
      }
    });

    this.totalPendingBalance = pending;
    this.paidCount = paid;
    this.overdueCount = overdue;
  }

  public applyFilters(): void {
    this.loadMyFees();
  }

  public clearFilters(): void {
    this.statusFilter = '';
    this.unitFilter = '';
    this.periodFilter = null;
    this.loadMyFees();
  }

  public payFee(fee: FeeInterface): void {
    // Simular el pago
    this.message.info(`Pago de la expensa (${fee.unit?.uni_code} - ${fee.fee_period}) iniciado. Redirigiendo a la pasarela de pagos...`);
    
    // Simular éxito después de 2 segundos para dar una experiencia de interacción dinámica premium
    setTimeout(() => {
      const payload = {
        fee_period: fee.fee_period,
        fee_amount: fee.fee_amount,
        fee_duedate: fee.fee_duedate,
        fee_status: 'Pagada'
      };

      const { cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid } = fee;
      if (!cmp_uuid || !usr_uuid || !uni_uuid || !usruni_uuid || !fee_uuid) return;

      this.feesService.updateFee(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, payload).subscribe({
        next: (res: any) => {
          this.message.success('Expensa pagada con éxito. Transacción registrada.');
          this.loadMyFees();
        },
        error: (err: any) => {
          console.error(err);
          this.message.error('Ocurrió un error al procesar el pago.');
        }
      });
    }, 2000);
  }

  public getBadgeStatus(status: string): 'success' | 'error' | 'warning' | 'processing' | 'default' {
    switch (status) {
      case 'Pendiente':
        return 'processing';
      case 'Pagada':
        return 'success';
      case 'Vencida':
        return 'error';
      default:
        return 'default';
    }
  }

  private formatPeriod(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}`;
  }
}
