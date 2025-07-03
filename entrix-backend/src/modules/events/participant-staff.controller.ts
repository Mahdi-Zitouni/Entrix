import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ParticipantStaffService } from './participant-staff.service';
import { CreateParticipantStaffDto } from './dto/create-participant-staff.dto';
import { UpdateParticipantStaffDto } from './dto/update-participant-staff.dto';

@ApiTags('Participant Staff')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('participant-staff')
export class ParticipantStaffController {
  constructor(private readonly participantStaffService: ParticipantStaffService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new participant staff assignment' })
  create(@Body() dto: CreateParticipantStaffDto) {
    return this.participantStaffService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participant staff assignments' })
  findAll() {
    return this.participantStaffService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a participant staff assignment by ID' })
  findOne(@Param('id') id: string) {
    return this.participantStaffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a participant staff assignment' })
  update(@Param('id') id: string, @Body() dto: UpdateParticipantStaffDto) {
    return this.participantStaffService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a participant staff assignment' })
  remove(@Param('id') id: string) {
    return this.participantStaffService.remove(id);
  }
} 