import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeesService } from '../../core/services/fees.service';
import { SessionService } from '../../core/services/session.service';
import { UserUnitsService } from '../../core/services/user-units.service';
import { UnitsService } from '../../core/services/units.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { CompanySettingsService } from '../../core/services/company-settings.service';
import { FeeInterface } from '../../core/interfaces/fee/fee.interface';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
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
    NzMessageModule,
    NzModalModule,
    NzInputModule
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

  // Modal de Pago por Transferencia
  isTransferModalVisible = false;
  transferReference = '';
  isSubmittingTransfer = false;
  bankSettings: any = {};
  pendingTransactionsMap: { [key: string]: boolean } = {};
  selectedFee: FeeInterface | null = null;

  constructor(
    private feesService: FeesService,
    private sessionService: SessionService,
    private userUnitsService: UserUnitsService,
    private unitsService: UnitsService,
    private _transactionsService: TransactionsService,
    private companySettingsService: CompanySettingsService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;

    if (this.usrUuid) {
      this.loadMyUnits();
      this.loadMyFees();
      this.loadBankSettings();
    } else {
      this.message.warning('No se pudo identificar tu usuario en la sesión.');
    }
  }

  public async loadMyUnits(): Promise<void> {
    try {
      const res: any = await lastValueFrom(this.userUnitsService.getUserUnits(this.cmpUuid, this.usrUuid));
      if (res.success && res.data) {
        this.myUnits = res.data
          .filter((m: any) => m.unit)
          .map((m: any) => m.unit);
      }
    } catch (err) {
      console.error('Error al cargar unidades del habitante:', err);
    }
  }

  public loadBankSettings(): void {
    this.companySettingsService.getCompanySettings(this.cmpUuid).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const settingsList = res.data || [];
          const settingsObj: any = {};
          settingsList.forEach((item: any) => {
            settingsObj[item.cmps_key] = item.cmps_value;
          });
          this.bankSettings = settingsObj;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar ajustes del consorcio:', err);
      }
    });
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

    this._transactionsService.getTransactions(this.cmpUuid, { usr_uuid: this.usrUuid, tra_status: 'Pending' }).subscribe({
      next: (traRes: any) => {
        this.pendingTransactionsMap = {};
        if (traRes.success && traRes.data) {
          traRes.data.forEach((tra: any) => {
            if (tra.fee_uuid) {
              this.pendingTransactionsMap[tra.fee_uuid] = true;
            }
          });
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
      },
      error: (err: any) => {
        console.error('Error al cargar transacciones pendientes:', err);
        this.feesService.getFees(this.cmpUuid, filters).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            if (res.success) {
              this.fees = res.data || [];
              this.calculateSummary();
            }
          },
          error: (feeErr: any) => {
            this.isLoading = false;
            console.error(feeErr);
            this.message.error('No se pudieron cargar tus expensas.');
          }
        });
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
    this.selectedFee = fee;
    this.transferReference = '';
    this.isTransferModalVisible = true;
    this.loadBankSettings();
  }

  public closeTransferModal(): void {
    this.isTransferModalVisible = false;
    this.selectedFee = null;
    this.transferReference = '';
  }

  public copyText(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.message.success('Copiado al portapapeles');
    }).catch(err => {
      console.error('Error al copiar al portapapeles:', err);
      this.message.error('No se pudo copiar el texto.');
    });
  }

  public submitTransferReport(): void {
    if (!this.selectedFee || !this.transferReference.trim()) return;

    const fee = this.selectedFee;
    const { cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid } = fee;
    if (!cmp_uuid || !usr_uuid || !uni_uuid || !usruni_uuid || !fee_uuid) {
      this.message.error('Información de expensa incompleta.');
      return;
    }

    this.isSubmittingTransfer = true;

    const transactionPayload = {
      cmp_uuid,
      usr_uuid,
      uni_uuid,
      usruni_uuid,
      fee_uuid,
      tra_gatewayid: this.transferReference.trim(),
      tra_totalamount: fee.fee_amount,
      tra_platformfee: 0.00,
      tra_recipientamount: fee.fee_amount,
      tra_status: 'Pending'
    };

    this._transactionsService.saveTransaction(transactionPayload).subscribe({
      next: (res: any) => {
        this.isSubmittingTransfer = false;
        this.message.success('Comprobante de pago enviado. La administración verificará tu transferencia bancaria.');
        this.closeTransferModal();
        this.loadMyFees();
      },
      error: (err: any) => {
        this.isSubmittingTransfer = false;
        console.error('Error al guardar la transacción de transferencia:', err);
        this.message.error('Ocurrió un error al registrar la transferencia.');
      }
    });
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

  public isFeePending(feeUuid: string | null): boolean {
    return !!(feeUuid && this.pendingTransactionsMap[feeUuid]);
  }

  private formatPeriod(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}`;
  }

  public downloadReceipt(fee: FeeInterface): void {
    if (!fee.fee_uuid) return;
    this.isLoading = true;

    this._transactionsService.getTransactions(this.cmpUuid, { fee_uuid: fee.fee_uuid, tra_status: 'Approved' }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data && res.data.length > 0) {
          const transaction = res.data[0];
          this.triggerReceiptPrint(transaction);
        } else {
          this.message.warning('No se encontró un comprobante de pago aprobado para esta expensa.');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error al cargar la transacción:', err);
        this.message.error('Ocurrió un error al recuperar el comprobante.');
      }
    });
  }

  private triggerReceiptPrint(tra: any): void {
    const uniqueName = new Date().getTime();
    const printWindow = window.open('about:blank', 'Print' + uniqueName, 'width=600,height=800');
    if (!printWindow) {
      this.message.error('El navegador bloqueó la ventana emergente. Habilita las ventanas emergentes para imprimir tu recibo.');
      return;
    }

    const dateFormatted = tra.tra_createdat ? new Date(tra.tra_createdat).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) : 'N/A';

    const amountFormatted = new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS'
    }).format(tra.tra_totalamount ?? 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Pago #${tra.tra_gatewayid || ''}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #334155;
              padding: 30px;
              margin: 0;
              background-color: #ffffff;
            }
            .receipt-container {
              max-width: 500px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px dashed #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .logo-text {
              font-size: 20px;
              font-weight: 800;
              margin: 0;
              color: #4f46e5;
            }
            .title-area {
              text-align: right;
            }
            .title-area h3 {
              margin: 0;
              font-size: 14px;
              color: #4f46e5;
              letter-spacing: 1px;
            }
            .title-area p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
            }
            .status-badge {
              display: inline-block;
              background-color: #dcfce7;
              color: #166534;
              border: 1px solid #bbf7d0;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 20px 0;
            }
            .section {
              margin-bottom: 24px;
            }
            .section-title {
              font-size: 11px;
              text-transform: uppercase;
              color: #94a3b8;
              font-weight: 700;
              letter-spacing: 1px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 6px;
              margin-bottom: 12px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              font-size: 13.5px;
              margin-bottom: 8px;
            }
            .row span {
              color: #64748b;
            }
            .row strong {
              color: #0f172a;
            }
            .mono {
              font-family: monospace;
              background-color: #f1f5f9;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
            }
            .amount-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin-top: 30px;
            }
            .amount-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              margin-bottom: 6px;
            }
            .amount-value {
              font-size: 28px;
              font-weight: 800;
              color: #166534;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11.5px;
              color: #94a3b8;
              line-height: 1.6;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            .footer p {
              margin: 4px 0;
            }
            .congrats {
              font-weight: 600;
              color: #4f46e5;
              margin-top: 10px !important;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt-container {
                border: none;
                box-shadow: none;
                padding: 0;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo-area">
                <span class="logo-text">ATS Community</span>
              </div>
              <div class="title-area">
                <h3>COMPROBANTE DE PAGO</h3>
                <p>Emitido el: ${dateFormatted}</p>
              </div>
            </div>

            <center>
              <div class="status-badge">Aprobado</div>
            </center>

            <div class="section">
              <div class="section-title">Detalles del Pago</div>
              <div class="row">
                <span>Referencia de Pago:</span>
                <strong>${tra.tra_gatewayid || ''}</strong>
              </div>
              <div class="row">
                <span>ID Transacción:</span>
                <span class="mono">${tra.tra_uuid || ''}</span>
              </div>
              <div class="row">
                <span>Fecha y Hora:</span>
                <span>${dateFormatted}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Datos del Consorcio y Habitante</div>
              <div class="row">
                <span>Unidad Funcional:</span>
                <strong>${tra.unit?.uni_code || 'N/A'} (${tra.unit?.uni_category || 'N/A'})</strong>
              </div>
              <div class="row">
                <span>Habitante:</span>
                <span>${tra.usr ? tra.usr.usr_name + ' ' + tra.usr.usr_surname : 'N/A'}</span>
              </div>
              <div class="row">
                <span>Email:</span>
                <span>${tra.usr?.usr_email || 'N/A'}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Concepto Liquidado</div>
              <div class="row">
                <span>Expensas Período:</span>
                <strong>${tra.fee?.fee_period || 'N/A'}</strong>
              </div>
            </div>

            <div class="amount-box">
              <div class="amount-label">Monto Total Pagado</div>
              <div class="amount-value">${amountFormatted}</div>
            </div>

            <div class="footer">
              <p>Este documento es un comprobante válido del pago realizado de forma electrónica a través de la plataforma ATS Community.</p>
              <p class="congrats">¡Gracias por mantener tus expensas al día!</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
