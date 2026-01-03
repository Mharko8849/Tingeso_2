package com.toolrent.kardex.Repository;

import com.toolrent.kardex.Entity.Kardex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.util.List;

@Repository
public interface KardexRepository extends JpaRepository<Kardex,Long> {

    List<Kardex> findByDate(Date date);

    List<Kardex> findByUserId(Long userId);

    List<Kardex> findByType(String type);

    List<Kardex> findByToolId(Long toolId);

    List<Kardex> findByDateGreaterThan(Date date);

    List<Kardex> findByDateLessThan(Date date);

    List<Kardex> findByDateBetween(Date date1, Date date2);

}
