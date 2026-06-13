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
    if (!this.selectedTransaction) return;

    const tra = this.selectedTransaction;
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
