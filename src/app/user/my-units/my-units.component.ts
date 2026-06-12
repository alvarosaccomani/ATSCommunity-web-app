import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserUnitsService } from '../../core/services/user-units.service';
import { UnitsService } from '../../core/services/units.service';
import { SessionService } from '../../core/services/session.service';
import { UserUnitInterface } from '../../core/interfaces/user-unit';
import { UnitInterface } from '../../core/interfaces/unit';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { lastValueFrom } from 'rxjs';

interface EnrichedUserUnit extends UserUnitInterface {
  unitDetail?: UnitInterface | null;
}

@Component({
  selector: 'app-my-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzTableModule,
    NzCardModule,
    NzIconModule,
    NzBadgeModule,
    NzMessageModule
  ],
  templateUrl: './my-units.component.html',
  styleUrl: './my-units.component.scss'
})
export class MyUnitsComponent implements OnInit {
  userUnits: EnrichedUserUnit[] = [];
  cmpUuid = '';
  usrUuid = '';
  isLoading = false;

  constructor(
    private userUnitsService: UserUnitsService,
    private unitsService: UnitsService,
    private sessionService: SessionService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';
    // Obtener cmp_uuid prioritario de la sesión, del localStorage o fallback a '1'
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;

    if (this.usrUuid) {
      this.loadMyUnits();
    } else {
      this.message.warning('No se pudo identificar tu usuario en la sesión.');
    }
  }

  public async loadMyUnits(): Promise<void> {
    this.isLoading = true;
    try {
      // Solicitar mapeo de relaciones user-unit
      const res: any = await lastValueFrom(this.userUnitsService.getUserUnits(this.cmpUuid, this.usrUuid));
      if (res.success && res.data) {
        const mappings: UserUnitInterface[] = res.data;
        const enriched: EnrichedUserUnit[] = [];

        // Enriquecer cada mapeo con los detalles físicos de la unidad (código, categoría, etc.)
        for (const mapping of mappings) {
          if (mapping.uni_uuid) {
            try {
              const unitRes = await lastValueFrom(this.unitsService.getUnitById(this.cmpUuid, mapping.uni_uuid)) as any;
              enriched.push({
                ...mapping,
                unitDetail: unitRes.success ? unitRes.data : null
              });
            } catch (unitErr) {
              console.error(`Error cargando unidad ${mapping.uni_uuid}:`, unitErr);
              enriched.push({
                ...mapping,
                unitDetail: null
              });
            }
          } else {
            enriched.push({
              ...mapping,
              unitDetail: null
            });
          }
        }
        this.userUnits = enriched;
      }
    } catch (err: any) {
      console.error(err);
      this.message.error('Ocurrió un error al cargar tus unidades funcionales.');
    } finally {
      this.isLoading = false;
    }
  }

  public getRelationBadgeColor(type: string): string {
    switch (type) {
      case 'Propietario':
        return '#52c41a'; // Verde
      case 'Copropietario':
        return '#13c2c2'; // Turquesa
      case 'Inquilino':
        return '#1890ff'; // Azul
      case 'Socio Principal':
        return '#722ed1'; // Púrpura
      default:
        return '#d9d9d9'; // Gris
    }
  }

  public getBadgeStatus(status: string): 'success' | 'error' | 'warning' {
    switch (status) {
      case 'Activo':
        return 'success';
      case 'Inactivo':
        return 'error';
      case 'En_Mantenimiento':
        return 'warning';
      default:
        return 'warning';
    }
  }

  public formatStatus(status: string): string {
    if (status === 'En_Mantenimiento') {
      return 'En Mantenimiento';
    }
    return status;
  }
}
