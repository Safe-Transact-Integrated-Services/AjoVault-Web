import { useNavigate } from 'react-router-dom';
import { Target, Users, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const CreateGoalSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-4 py-6 safe-top pb-24">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Create a Goal</h1>
          <p className="text-sm text-muted-foreground mt-1">Select what type of savings goal you want to start.</p>
        </div>

        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/savings/create')}
            className="flex items-center gap-4 rounded-2xl border border-accent/20 bg-accent/5 p-5 text-left transition-all hover:border-accent hover:bg-accent/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-base">Personal Goal</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Save individually for a specific target with interest.</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/group-goals/create')}
            className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left transition-all hover:border-primary hover:bg-primary/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-base">Group Goal</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Save with friends or family for a shared purpose.</p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CreateGoalSelect;
