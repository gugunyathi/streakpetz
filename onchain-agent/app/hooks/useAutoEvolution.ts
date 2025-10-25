import { useEffect, useCallback, useRef } from 'react';
import { Pet } from '@/lib/pet';

interface UseAutoEvolutionProps {
  pet: Pet | null;
  userWalletAddress: string | null;
  enabled?: boolean;
  onEvolutionDetected?: (result: any) => void;
}

interface EvolutionCheckResult {
  success: boolean;
  evolved: boolean;
  evolutionsApplied?: number;
  message?: string;
  evolutionLog?: string[];
  pet?: any;
  originalStage?: string;
  newStage?: string;
}

/**
 * Hook: useAutoEvolution
 * 
 * Automatically checks and applies pet evolution when:
 * - Component mounts (app opens)
 * - Wallet reconnects
 * - Pet data changes
 * - Window regains focus (app comes back from background)
 * - Network reconnects
 * 
 * This ensures pet evolution status is always up-to-date even after
 * offline periods, wallet disconnections, or app restarts.
 */
export function useAutoEvolution({
  pet,
  userWalletAddress,
  enabled = true,
  onEvolutionDetected
}: UseAutoEvolutionProps) {
  const hasCheckedRef = useRef(false);
  const lastCheckTimeRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkEvolution = useCallback(async (force: boolean = false) => {
    // Skip if disabled or missing required data
    if (!enabled || !pet || !userWalletAddress) {
      return;
    }

    // Debounce: Don't check more than once per minute unless forced
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTimeRef.current;
    if (!force && timeSinceLastCheck < 60000) {
      console.log('⏭️ Skipping evolution check (debounced)');
      return;
    }

    try {
      console.log('🔍 Checking for auto-evolution...');
      lastCheckTimeRef.current = now;

      // First, check eligibility (GET request - no side effects)
      // Ensure petId is a string (handle MongoDB ObjectId)
      const petIdString = String(pet.id);
      const eligibilityResponse = await fetch(
        `/api/pets/auto-evolve?userId=${userWalletAddress}&petId=${petIdString}`
      );
      const eligibility = await eligibilityResponse.json();

      if (eligibility.success && eligibility.canAutoEvolve) {
        console.log(`🎯 Evolution available: ${eligibility.possibleEvolutions} evolution(s)`);
        console.log('Evolution path:', eligibility.evolutionPath);

        // Apply evolution (POST request - applies changes)
        const petIdString = String(pet.id);
        const evolveResponse = await fetch('/api/pets/auto-evolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userWalletAddress,
            petId: petIdString
          })
        });

        const result: EvolutionCheckResult = await evolveResponse.json();

        if (result.success && result.evolved) {
          console.log(`🎉 Auto-evolution applied!`, result);
          console.log(`Evolution log: ${result.evolutionLog?.join(' → ')}`);

          // Notify parent component
          if (onEvolutionDetected) {
            onEvolutionDetected(result);
          }

          // Show user notification
          if (result.evolutionsApplied && result.evolutionsApplied > 1) {
            alert(`🎉 Wow! ${pet.name} evolved ${result.evolutionsApplied} times while you were away!\n${result.evolutionLog?.join('\n')}`);
          } else {
            alert(`🎉 ${result.message || 'Your pet evolved!'}`);
          }

          return result;
        } else {
          console.log('✅ Pet evolution is up to date');
        }
      } else {
        console.log('✅ No pending evolutions');
      }
    } catch (error) {
      console.error('Auto-evolution check failed:', error);
    }
  }, [pet, userWalletAddress, enabled, onEvolutionDetected]);

  // Check on mount (app opens or reconnects)
  useEffect(() => {
    if (!hasCheckedRef.current && enabled && pet && userWalletAddress) {
      hasCheckedRef.current = true;
      console.log('🚀 Initial auto-evolution check on mount');
      
      // Delay initial check slightly to let UI render
      setTimeout(() => {
        checkEvolution(true);
      }, 1000);
    }
  }, [pet, userWalletAddress, enabled, checkEvolution]);

  // Check when wallet address changes (reconnection)
  useEffect(() => {
    if (userWalletAddress && enabled) {
      console.log('🔄 Wallet reconnected - checking evolution');
      checkEvolution(true);
    }
  }, [userWalletAddress, enabled, checkEvolution]);

  // Check when window regains focus (user returns to app)
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      console.log('👀 Window focused - checking evolution');
      checkEvolution(false); // Use debouncing for focus events
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enabled, checkEvolution]);

  // Check when network reconnects
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log('🌐 Network reconnected - checking evolution');
      checkEvolution(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, checkEvolution]);

  // Periodic check (every 5 minutes while app is active)
  useEffect(() => {
    if (!enabled || !pet || !userWalletAddress) return;

    // Set up periodic check
    checkIntervalRef.current = setInterval(() => {
      console.log('⏰ Periodic evolution check (5 min interval)');
      checkEvolution(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, pet, userWalletAddress, checkEvolution]);

  // Manual trigger function (can be called from UI)
  const manualCheck = useCallback(() => {
    console.log('🔧 Manual evolution check triggered');
    return checkEvolution(true);
  }, [checkEvolution]);

  return {
    checkEvolution: manualCheck
  };
}
