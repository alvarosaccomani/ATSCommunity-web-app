import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { SessionService } from '../../core/services/session.service';
import { CompanySettingsService } from '../../core/services/company-settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzInputModule,
    NzMessageModule,
    NzSpinModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  isLoading = true;
  isSaving = false;
  cmpUuid = '';
  
  // Cache to track uuid and parameters of existing rows
  existingSettings: { [key: string]: any } = {};

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private companySettingsService: CompanySettingsService,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    const activeCompany = this.sessionService.getCompany();
    this.cmpUuid = activeCompany?.cmp_uuid || '';

    if (!this.cmpUuid) {
      this.message.error('No se pudo identificar la comunidad activa.');
      this.isLoading = false;
      return;
    }

    this.loadSettings();
  }

  private initForm(): void {
    this.settingsForm = this.fb.group({
      // Datos Bancarios
      bank_name: ['', [Validators.required]],
      bank_cbu: ['', [Validators.required, Validators.pattern(/^\d{22}$/)]],
      bank_alias: ['', [Validators.required]],
      bank_owner: ['', [Validators.required]],
      
      // Políticas Financieras
      late_fee_interest: [0, [Validators.required, Validators.min(0)]],
      due_day: [10, [Validators.required, Validators.min(1), Validators.max(31)]],
      
      // Datos Generales
      community_legal_name: ['', [Validators.required]],
      community_cuit: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      community_address: ['', [Validators.required]]
    });
  }

  public loadSettings(): void {
    this.isLoading = true;
    this.existingSettings = {};
    
    this.companySettingsService.getCompanySettings(this.cmpUuid).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const settingsList = res.data || [];
          
          settingsList.forEach((item: any) => {
            this.existingSettings[item.cmps_key] = item;
            
            // Populate form if matching key exists
            if (this.settingsForm.controls[item.cmps_key]) {
              let val = item.cmps_value;
              if (item.cmps_datatype === 'number') {
                val = Number(item.cmps_value);
              }
              this.settingsForm.controls[item.cmps_key].setValue(val);
            }
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar ajustes del consorcio:', err);
        this.message.error('No se pudieron recuperar los ajustes del consorcio.');
      }
    });
  }

  public saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.message.warning('Por favor, completa correctamente todos los campos del formulario.');
      return;
    }

    const saveObservables: Observable<any>[] = [];
    const formValues = this.settingsForm.value;

    // Keys definitions metadata in case settings do not exist and must be created
    const keysMetadata: { [key: string]: { parameter: string, desc: string, type: string, group: string } } = {
      bank_name: { parameter: 'Banco de Transferencias', desc: 'Nombre de la entidad bancaria para depósitos', type: 'string', group: 'Bancos' },
      bank_cbu: { parameter: 'CBU / CVU', desc: 'Clave Bancaria Uniforme (22 dígitos)', type: 'string', group: 'Bancos' },
      bank_alias: { parameter: 'Alias de Transferencia', desc: 'Alias asociado a la cuenta bancaria', type: 'string', group: 'Bancos' },
      bank_owner: { parameter: 'Titular de Cuenta', desc: 'Nombre completo del titular de la cuenta bancaria', type: 'string', group: 'Bancos' },
      late_fee_interest: { parameter: 'Interés por Mora %', desc: 'Tasa mensual de interés aplicada a expensas vencidas', type: 'number', group: 'Finanzas' },
      due_day: { parameter: 'Día de Vencimiento', desc: 'Día del mes límite para el pago de expensas sin recargos', type: 'number', group: 'Finanzas' },
      community_legal_name: { parameter: 'Razón Social', desc: 'Nombre legal del consorcio o edificio', type: 'string', group: 'General' },
      community_cuit: { parameter: 'CUIT Consorcio', desc: 'Clave Única de Identificación Tributaria (11 dígitos sin guiones)', type: 'string', group: 'General' },
      community_address: { parameter: 'Dirección Principal', desc: 'Dirección física principal del consorcio', type: 'string', group: 'General' }
    };

    Object.keys(formValues).forEach(key => {
      const val = String(formValues[key]);
      const existing = this.existingSettings[key];

      if (existing) {
        // Only update if value changed to minimize DB operations
        if (existing.cmps_value !== val) {
          const payload = {
            cmps_key: key,
            cmps_parameter: existing.cmps_parameter,
            cmps_description: existing.cmps_description,
            cmps_value: val,
            cmps_datatype: existing.cmps_datatype,
            cmps_options: existing.cmps_options || '',
            cmps_group: existing.cmps_group
          };
          saveObservables.push(this.companySettingsService.updateCompanySetting(this.cmpUuid, existing.cmps_uuid, payload));
        }
      } else {
        // Create setting if not initialized in the database
        const meta = keysMetadata[key];
        const newUuid = 'SET-' + Math.random().toString(36).substring(2, 9).toUpperCase() + '-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        const payload = {
          cmp_uuid: this.cmpUuid,
          cmps_uuid: newUuid,
          cmps_key: key,
          cmps_parameter: meta.parameter,
          cmps_description: meta.desc,
          cmps_value: val,
          cmps_datatype: meta.type,
          cmps_options: '',
          cmps_group: meta.group
        };
        saveObservables.push(this.companySettingsService.saveCompanySetting(payload));
      }
    });

    if (saveObservables.length === 0) {
      this.message.info('No hay modificaciones para guardar.');
      return;
    }

    this.isSaving = true;
    forkJoin(saveObservables).subscribe({
      next: () => {
        this.isSaving = false;
        this.message.success('Ajustes del consorcio guardados correctamente.');
        this.loadSettings();
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error al guardar ajustes:', err);
        this.message.error('No se pudieron persistir todos los cambios.');
      }
    });
  }
}
