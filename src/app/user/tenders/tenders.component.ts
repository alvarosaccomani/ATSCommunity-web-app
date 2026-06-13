import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { ClaimsService } from '../../core/services/claims.service';
import { TendersService } from '../../core/services/tenders.service';
import { TenderOptionsService } from '../../core/services/tender-options.service';
import { VotesService } from '../../core/services/votes.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-tenders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzSkeletonModule,
    NzTableModule,
    NzTabsModule,
    NzToolTipModule,
    NzMessageModule,
    NzGridModule
  ],
  templateUrl: './tenders.component.html',
  styleUrl: './tenders.component.scss'
})
export class TendersComponent implements OnInit {
  isLoading = true;
  cmpUuid = '';
  usrUuid = '';
  userName = '';
  
  // Licitaciones lists
  tendersData: any[] = []; // Active tenders
  closedTendersData: any[] = []; // Adjudicated/Finished tenders

  constructor(
    private sessionService: SessionService,
    private claimsService: ClaimsService,
    private tendersService: TendersService,
    private tenderOptionsService: TenderOptionsService,
    private votesService: VotesService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    const activeCompany = this.sessionService.getCompany();

    this.usrUuid = session?.identity?.usr_uuid || '';
    this.userName = session?.identity?.usr_name || 'Usuario';
    this.cmpUuid = activeCompany?.cmp_uuid || '';

    if (!this.cmpUuid || !this.usrUuid) {
      this.message.error('No se pudo identificar tu sesión.');
      this.isLoading = false;
      return;
    }

    this.loadAllTenders();
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

  public loadAllTenders(): void {
    this.isLoading = true;
    this.tendersData = [];
    this.closedTendersData = [];

    this.claimsService.getClaims(this.cmpUuid).subscribe({
      next: (resClaims: any) => {
        if (!resClaims.success || !resClaims.data || resClaims.data.length === 0) {
          this.isLoading = false;
          return;
        }

        const claimsList = resClaims.data || [];
        
        // Filter claims into active and closed
        const activeClaims = claimsList.filter((c: any) => c.cla_status === 'En Licitacion');
        const closedClaims = claimsList.filter((c: any) => c.cla_status === 'En Obra' || c.cla_status === 'FinalizadoAprobado');

        const activeObservables = this.buildTenderObservables(activeClaims);
        const closedObservables = this.buildTenderObservables(closedClaims);

        forkJoin({
          active: activeObservables.length > 0 ? forkJoin(activeObservables) : of([]),
          closed: closedObservables.length > 0 ? forkJoin(closedObservables) : of([])
        }).subscribe({
          next: (res: any) => {
            this.isLoading = false;

            // Process Active Tenders
            this.tendersData = (res.active || [])
              .filter((item: any) => item !== null)
              .map((item: any) => this.processTenderData(item));

            // Process Closed Tenders
            this.closedTendersData = (res.closed || [])
              .filter((item: any) => item !== null)
              .map((item: any) => this.processTenderData(item));
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al resolver detalles de licitaciones:', err);
            this.message.error('Ocurrió un error al cargar la información detallada.');
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar reclamos para licitación:', err);
        this.message.error('No se pudieron recuperar las licitaciones.');
      }
    });
  }

  private buildTenderObservables(claims: any[]): any[] {
    return claims.map(claim => {
      return this.tendersService.getTenders(this.cmpUuid, claim.cla_uuid).pipe(
        switchMap((resTender: any) => {
          if (resTender.success && resTender.data && resTender.data.length > 0) {
            const tender = resTender.data[0];
            return forkJoin({
              options: this.tenderOptionsService.getTenderOptions(this.cmpUuid, claim.cla_uuid, tender.ten_uuid).pipe(catchError(() => of({ success: true, data: [] }))),
              votes: this.votesService.getVotes(this.cmpUuid, claim.cla_uuid, tender.ten_uuid).pipe(catchError(() => of({ success: true, data: [] })))
            }).pipe(
              map((details: any) => ({
                claim,
                tender,
                options: details.options?.success ? details.options.data || [] : [],
                votes: details.votes?.success ? details.votes.data || [] : []
              }))
            );
          } else {
            return of(null);
          }
        }),
        catchError((err) => {
          console.error(`Error loading tender details for claim ${claim.cla_uuid}`, err);
          return of(null);
        })
      );
    });
  }

  private processTenderData(item: any): any {
    const totalVotes = item.votes.length;
    const userVote = item.votes.find((v: any) => v.usr_uuid === this.usrUuid);

    // Calculate votes counts and percentages per option
    item.options.forEach((opt: any) => {
      const optVotes = item.votes.filter((v: any) => v.tenopt_uuid === opt.tenopt_uuid);
      opt.votesCount = optVotes.length;
      opt.percentage = totalVotes > 0 ? Math.round((optVotes.length / totalVotes) * 100) : 0;
      
      // Mark if this option won (if closed tender)
      opt.isWinner = item.tender.ten_winneropt === opt.tenopt_uuid;
      opt.isUserChoice = userVote && userVote.tenopt_uuid === opt.tenopt_uuid;
    });

    return {
      ...item,
      totalVotes,
      userVote,
      isVoting: false,
      isClosing: false
    };
  }

  public castVote(item: any, option: any): void {
    if (item.isVoting || item.userVote) return;
    
    item.isVoting = true;

    const payload = {
      cmp_uuid: this.cmpUuid,
      cla_uuid: item.claim.cla_uuid,
      ten_uuid: item.tender.ten_uuid,
      usr_uuid: this.usrUuid,
      tenopt_uuid: option.tenopt_uuid
    };

    this.votesService.saveVote(payload).subscribe({
      next: (res: any) => {
        item.isVoting = false;
        if (res.success) {
          this.message.success('Tu voto ha sido registrado con éxito.');
          this.loadAllTenders();
        }
      },
      error: (err: any) => {
        item.isVoting = false;
        console.error('Error al registrar voto:', err);
        this.message.error(err.error?.error || 'No se pudo guardar tu voto.');
      }
    });
  }

  public adjudicateTender(item: any, option: any): void {
    if (item.isClosing) return;

    item.isClosing = true;

    const tenderPayload = {
      ...item.tender,
      ten_status: 'Cerrada',
      ten_winneropt: option.tenopt_uuid
    };

    // 1. Close the tender
    this.tendersService.updateTender(this.cmpUuid, item.claim.cla_uuid, item.tender.ten_uuid, tenderPayload).subscribe({
      next: (res: any) => {
        if (res.success) {
          // 2. Update the claim status to 'En Obra'
          const claimPayload = {
            ...item.claim,
            cla_status: 'En Obra'
          };
          this.claimsService.updateClaim(this.cmpUuid, item.claim.cla_uuid, claimPayload).subscribe({
            next: () => {
              item.isClosing = false;
              this.message.success('Licitación adjudicada con éxito. La obra ha sido iniciada.');
              this.loadAllTenders();
            },
            error: (err) => {
              item.isClosing = false;
              console.error('Error al actualizar estado del reclamo:', err);
              this.message.error('Se cerró la licitación pero no se pudo cambiar el estado del reporte.');
              this.loadAllTenders();
            }
          });
        }
      },
      error: (err) => {
        item.isClosing = false;
        console.error('Error al cerrar la licitación:', err);
        this.message.error('No se pudo adjudicar el presupuesto.');
      }
    });
  }

  // Format Helpers
  public formatStatus(status: string): string {
    switch (status) {
      case 'Abierto': return 'Abierto';
      case 'En Licitacion': return 'En Licitación';
      case 'Aprobado': return 'Aprobado';
      case 'En Obra': return 'En Obra / Curso';
      case 'FinalizadoAprobado': return 'Finalizado';
      case 'Rechazado': return 'Rechazado';
      default: return status || 'Desconocido';
    }
  }

  public getBadgeStatus(status: string): string {
    switch (status) {
      case 'En Licitacion': return 'processing';
      case 'En Obra': return 'warning';
      case 'FinalizadoAprobado': return 'success';
      default: return 'default';
    }
  }
}
