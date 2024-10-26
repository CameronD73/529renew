-- check first - this is a script the probably only ever needed one run.
-- cleaning up old data with huge decimal "precision"

select * from ibdsegs where cM - 0.01*floor(100.0*cM+0.5) > 0.001;

select * from DNAmatches where cMtotal - 0.01*floor(100.0*cMtotal+0.5) > 0.001;

select * from DNAmatches where largestSeg - 0.01*floor(100.0*largestSeg+0.5) > 0.001;


STOP 'dont run without thinking'
update ibdsegs
set cM =  0.01*floor(100.0*cM+0.5)  where  cM - 0.01*floor(100.0*cM+0.5) > 0.001;
