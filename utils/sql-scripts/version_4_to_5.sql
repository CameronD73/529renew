-- sqlite ALTER TABLE commands are very limited in capability.
-- To modify columns or add defaults like CURRENT_DATE
-- required recreate/copy/destroy operations.
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- add a matching column so that the later transfer has matching column count.
ALTER TABLE idalias  ADD COLUMN lastUpdated TEXT DEFAULT NULL;

CREATE TABLE idaliasNEW(IDText TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL,
        date TEXT NOT NULL,
		hapMat TEXT DEFAULT null, hapPat TEXT DEFAULT null,
        bYear INTEGER DEFAULT null,
        familySurnames TEXT DEFAULT NULL, familyLocations TEXT DEFAULT NULL, familyTreeURL TEXT DEFAULT NULL,
        lastUpdated TEXT DEFAULT CURRENT_DATE );
        
CREATE INDEX if not exists idalias_name ON idaliasNEW ( name );

INSERT INTO idaliasNEW SELECT * FROM idalias;

UPDATE idaliasNEW SET lastUpdated = CURRENT_DATE where lastUpdated is null;

DROP TABLE idalias;
ALTER TABLE idaliasNEW RENAME TO idalias;



CREATE TABLE DNAmatchesNEW  ( ID1 TEXT  NOT NULL REFERENCES idalias(IDText)  ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
						ID2 TEXT NOT NULL REFERENCES idalias(IDText) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
						ishidden INTEGER DEFAULT 0,
						pctshared REAL, cMtotal REAL, nsegs INTEGER DEFAULT null, hasSegs INTEGER DEFAULT 0,
						lastdate TEXT DEFAULT CURRENT_DATE,
						largestSeg REAL NOT NULL DEFAULT 0.0, predictedRel TEXT DEFAULT NULL,
						PRIMARY KEY(ID1,ID2,ishidden) );
						
INSERT INTO DNAmatchesNEW select * from DNAmatches;

UPDATE DNAmatchesNEW SET lastdate = CURRENT_DATE where lastdate is null;

DROP TABLE DNAmatches;
ALTER TABLE DNAmatchesNEW RENAME TO DNAmatches;
						
INSERT INTO DNAmatchesNEW select * from DNAmatches;

UPDATE DNAmatchesNEW SET lastdate = CURRENT_DATE where lastdate is null;

DROP TABLE DNAmatches;
ALTER TABLE DNAmatchesNEW RENAME TO DNAmatches;


COMMIT TRANSACTION;

CREATE TRIGGER IF NOT EXISTS bump_date_matches 
	AFTER UPDATE ON DNAmatches
	FOR EACH ROW
	BEGIN
		UPDATE DNAmatches SET lastdate = CURRENT_DATE WHERE _rowid_ = new._rowid_;
	END;

CREATE TRIGGER IF NOT EXISTS bump_date_rels 
	AFTER UPDATE ON DNARelatives
	FOR EACH ROW
	BEGIN
		UPDATE DNAmatches SET lastdate = CURRENT_DATE WHERE _rowid_ = new._rowid_;
	END;
