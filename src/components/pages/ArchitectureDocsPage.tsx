import React, { useState } from 'react';
import { Database, Server, Shield, Users } from 'lucide-react';
import { useMission } from '../../context/MissionContext';
import { soundFx } from '../../utils/soundFx';

export const ArchitectureDocsPage: React.FC = () => {
  const { userProfile, updateUserProfile, playerProgression } = useMission();
  const [callsign, setCallsign] = useState(userProfile.callsign);
  const [email, setEmail] = useState(userProfile.email);
  const [teamName, setTeamName] = useState(userProfile.teamName);
  const [role, setRole] = useState(userProfile.role);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callsign.trim() || !teamName.trim()) return;
    soundFx.playSuccessFanfare();
    updateUserProfile({
      ...userProfile,
      callsign: callsign.trim(),
      email: email.trim(),
      teamName: teamName.trim(),
      role,
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">
          System Architecture · Backend Integration Plan &amp; Crew Roster
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
          Java 21 Spring Boot &amp; MySQL 8.4 Integration Guide
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          This preview runs the separated React + Three.js frontend prototype with deterministic local
          simulation because the container environment provides Node.js only (without JDK 21, Maven, or MySQL).
          The complete backend and database scripts are included in the repository.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Crew & Team Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-5 hud-frame rounded-2xl p-6 space-y-4 border border-cyan-500/30"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-300" aria-hidden="true" />
              <h2 className="font-display text-lg font-bold text-white">
                Cadet &amp; Team Assignment
              </h2>
            </div>
            <span className="text-[11px] font-mono text-amber-300">
              LVL {playerProgression.level} {playerProgression.rankTitle}
            </span>
          </div>

          <div>
            <label htmlFor="crew-callsign" className="block text-xs font-mono text-slate-400 mb-1">
              Commander / Cadet Callsign
            </label>
            <input
              id="crew-callsign"
              type="text"
              required
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#050819] border border-slate-700 text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="crew-email" className="block text-xs font-mono text-slate-400 mb-1">
              Email (used for Spring Boot Auth sync)
            </label>
            <input
              id="crew-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#050819] border border-slate-700 text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="crew-team" className="block text-xs font-mono text-slate-400 mb-1">
              Engineering Team Name
            </label>
            <input
              id="crew-team"
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#050819] border border-slate-700 text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="crew-role" className="block text-xs font-mono text-slate-400 mb-1">
              Mission Role
            </label>
            <select
              id="crew-role"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full px-3 py-2 rounded-lg bg-[#050819] border border-slate-700 text-sm text-white"
            >
              <option value="Commander">Commander</option>
              <option value="Flight Engineer">Flight Engineer</option>
              <option value="Science Lead">Science Lead</option>
            </select>
          </div>

          <button
            type="submit"
            className="menu-blade glow-cta w-full py-2.5 font-display font-bold text-sm uppercase tracking-wider cursor-pointer"
          >
            Save Crew Assignment
          </button>
        </form>

        {/* Architecture Overview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="hud-frame rounded-2xl p-6 space-y-3 border border-violet-500/30">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-300" aria-hidden="true" />
              Layered Java 21 + Spring Boot Architecture
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              The backend under <code className="font-mono text-cyan-300">backend/</code> implements
              Controllers, Services, Spring Data JPA Repositories, Entities, DTOs, Security Config,
              and an authoritative <code className="font-mono text-cyan-300">SimulationEngine</code>{' '}
              that recalculates mass, power, budget, and scoring on the server—never trusting client totals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300 pt-2">
              <div className="p-3 rounded-xl bg-[#050819] border border-cyan-500/25">
                POST /api/v1/auth/register · /login
              </div>
              <div className="p-3 rounded-xl bg-[#050819] border border-violet-500/25">
                GET /api/v1/catalog/bootstrap
              </div>
              <div className="p-3 rounded-xl bg-[#050819] border border-fuchsia-500/25">
                POST / PUT /api/v1/spacecraft
              </div>
              <div className="p-3 rounded-xl bg-[#050819] border border-amber-500/25">
                POST /api/v1/simulations/run
              </div>
            </div>
          </div>

          <div className="hud-frame rounded-2xl p-6 space-y-3 border border-fuchsia-500/30">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-300" aria-hidden="true" />
              MySQL 8.4 Schema (mission_orbit_db)
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Full relational DDL and sample seed scripts are located in{' '}
              <code className="font-mono text-cyan-300">database/schema.sql</code> and{' '}
              <code className="font-mono text-cyan-300">database/seed.sql</code> covering all 15
              tables: users, teams, team_members, missions, mission_objectives, spacecraft,
              components, spacecraft_components, launch_vehicles, orbits, mission_runs,
              mission_events, mission_event_choices, mission_results, and mission_reports.
            </p>
          </div>

          <div className="hud-frame rounded-2xl p-6 space-y-2 border border-emerald-500/30">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              Deterministic Educational Scoring Formula
            </h2>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Overall Score = 40% Engineering Score + 40% Scientific Achievement + 20% Resource Efficiency.
              Set <code className="text-cyan-300">VITE_API_BASE_URL=http://localhost:8080</code> in{' '}
              <code className="text-cyan-300">.env</code> to connect this React frontend directly to your local Spring Boot server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
